"use server";

import { shopConfig } from "@/lib/config";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateActiveCart, readCartLines } from "@/lib/cart/server";
import type { CartActionResult, CartLine } from "@/lib/cart/types";
import { cartLineSchema, cartLinesSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

async function loadMeals(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  if (!ids.length) return new Map<string, { price_cents: number; weekly_stock: number; is_active: boolean }>();
  const { data } = await supabase.from("meals").select("id, price_cents, weekly_stock, is_active").in("id", ids);
  return new Map((data ?? []).map((m) => [m.id, m]));
}

function maxFor(meal: { weekly_stock: number; is_active: boolean } | undefined) {
  if (!meal || !meal.is_active) return 0;
  return Math.min(meal.weekly_stock, shopConfig.maxQtyPerLine);
}

/** Set a line's quantity (0 removes it). RLS ensures users only touch their own cart. */
export async function setCartLine(input: CartLine): Promise<CartActionResult> {
  const parsed = cartLineSchema.safeParse(input);
  if (!parsed.success) return { lines: [], error: "invalid" };
  const user = await getSessionUser();
  if (!user) return { lines: [], error: "unauthenticated" };

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateActiveCart(supabase, user.id);
    const { mealId, quantity } = parsed.data;
    const meals = await loadMeals(supabase, [mealId]);
    const meal = meals.get(mealId);
    const allowed = Math.min(quantity, maxFor(meal));
    const clamped = allowed !== quantity ? [{ mealId, quantity: allowed }] : undefined;

    if (allowed <= 0) {
      await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("meal_id", mealId);
    } else {
      const { error } = await supabase.from("cart_items").upsert(
        { cart_id: cartId, meal_id: mealId, quantity: allowed, unit_price_cents: meal!.price_cents },
        { onConflict: "cart_id,meal_id" },
      );
      if (error) throw error;
    }
    return { lines: await readCartLines(supabase, user.id), clamped, error: clamped && allowed === 0 ? "unavailable" : undefined };
  } catch (err) {
    console.error("[cart] setCartLine failed", err);
    return { lines: [], error: "server" };
  }
}

/** Merge a guest (localStorage) cart into the signed-in user's cart after login. */
export async function mergeGuestCart(guestLines: CartLine[]): Promise<CartActionResult> {
  const parsed = cartLinesSchema.safeParse(guestLines);
  if (!parsed.success) return { lines: [], error: "invalid" };
  const user = await getSessionUser();
  if (!user) return { lines: [], error: "unauthenticated" };

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateActiveCart(supabase, user.id);
    const current = await readCartLines(supabase, user.id);
    const merged = new Map(current.map((l) => [l.mealId, l.quantity]));
    for (const l of parsed.data) merged.set(l.mealId, (merged.get(l.mealId) ?? 0) + l.quantity);

    const meals = await loadMeals(supabase, [...merged.keys()]);
    const rows = [...merged.entries()]
      .map(([mealId, qty]) => ({ mealId, qty: Math.min(qty, maxFor(meals.get(mealId))) }))
      .filter((r) => r.qty > 0)
      .map((r) => ({ cart_id: cartId, meal_id: r.mealId, quantity: r.qty, unit_price_cents: meals.get(r.mealId)!.price_cents }));

    if (rows.length) {
      const { error } = await supabase.from("cart_items").upsert(rows, { onConflict: "cart_id,meal_id" });
      if (error) throw error;
    }
    return { lines: await readCartLines(supabase, user.id) };
  } catch (err) {
    console.error("[cart] mergeGuestCart failed", err);
    return { lines: [], error: "server" };
  }
}
