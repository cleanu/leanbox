import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CartLine } from "./types";

type Client = SupabaseClient<Database>;

/** Returns the user's active cart id, creating one if needed (race-safe). */
export async function getOrCreateActiveCart(supabase: Client, userId: string): Promise<string> {
  const existing = await supabase.from("carts").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (existing.data) return existing.data.id;
  const inserted = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
  if (inserted.data) return inserted.data.id;
  // Unique violation from a concurrent request — read the winner.
  const retry = await supabase.from("carts").select("id").eq("user_id", userId).eq("status", "active").single();
  if (retry.error) throw retry.error;
  return retry.data.id;
}

export async function getActiveCartId(supabase: Client, userId: string): Promise<string | null> {
  const { data } = await supabase.from("carts").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  return data?.id ?? null;
}

export async function readCartLines(supabase: Client, userId: string): Promise<CartLine[]> {
  const cartId = await getActiveCartId(supabase, userId);
  if (!cartId) return [];
  const { data } = await supabase
    .from("cart_items")
    .select("meal_id, quantity, created_at")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => ({ mealId: r.meal_id, quantity: r.quantity }));
}
