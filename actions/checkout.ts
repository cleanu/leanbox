"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { getSessionUser } from "@/lib/auth/session";
import { getActiveCartId, readCartLines } from "@/lib/cart/server";
import { deliveryFeeCents } from "@/lib/config";
import { siteUrl } from "@/lib/env";
import { isServiceRoleConfigured, isStripeConfigured } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { ensureStripeCustomer, getStripe } from "@/lib/stripe/server";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { isWeekOpen } from "@/lib/weeks";
import { orderRef } from "@/lib/utils";

export type CheckoutErrorKey = "name" | "phone" | "district" | "address" | "week" | "empty" | "stock" | "inactive" | "plan" | "stripe";

export type CheckoutValues = {
  name: string;
  phone: string;
  district: string;
  address: string;
  notes: string;
  week: string;
  saveDefault: boolean;
};

export type CheckoutState = {
  error?: CheckoutErrorKey;
  errorValues?: { name?: string; count?: number };
  fields?: Partial<Record<string, CheckoutErrorKey>>;
  /** Echo of what was submitted, so fields survive React's post-action form reset. */
  values?: CheckoutValues;
  nonce?: number;
};

type ItemDraft = Omit<TablesInsert<"order_items">, "order_id">;

/**
 * Validates the delivery form + cart (or plan) on the server, snapshots a
 * pending order, and redirects to Stripe Checkout. Prices, stock and COGS are
 * always re-read from the database — never trusted from the client.
 */
export async function startCheckout(prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const result = await runCheckout(prev, formData);
  const str = (k: string) => String(formData.get(k) ?? "");
  return {
    ...result,
    nonce: Date.now(),
    values: {
      name: str("name"),
      phone: str("phone"),
      district: str("district"),
      address: str("address"),
      notes: str("notes"),
      week: str("week"),
      saveDefault: formData.get("saveDefault") === "on",
    },
  };
}

async function runCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/checkout");
  if (!isStripeConfigured() || !isServiceRoleConfigured()) return { error: "stripe" };

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fields: fieldErrors(parsed.error) as CheckoutState["fields"] };
  const input = parsed.data;
  if (!isWeekOpen(input.week)) return { fields: { week: "week" } };

  const admin = createAdminClient();
  const supabase = await createClient();
  const locale = await getLocale();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();

  let items: ItemDraft[] = [];
  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotal = 0;
  let delivery = 0;
  let cartId: string | null = null;
  let planId: string | null = null;

  if (input.mode === "plan") {
    const { data: plan } = await admin.from("plans").select("*").eq("id", input.planId ?? "").eq("is_active", true).maybeSingle();
    if (!plan) return { error: "plan" };
    planId = plan.id;
    subtotal = plan.price_cents;
    delivery = 0; // plans include delivery
    items = [
      {
        plan_id: plan.id,
        name_snapshot: `${plan.name_zh}（每週 ${plan.meals_per_week} 餐）`,
        name_en_snapshot: `${plan.name_en} (${plan.meals_per_week} meals / week)`,
        quantity: 1,
        unit_price_cents: plan.price_cents,
        unit_cost_cents: plan.cost_cents,
      },
    ];
    lineItems = [
      plan.stripe_price_id
        ? { price: plan.stripe_price_id, quantity: 1 }
        : {
            // Dev fallback until a recurring Price is mapped in plans.stripe_price_id.
            price_data: {
              currency: "hkd",
              unit_amount: plan.price_cents,
              recurring: { interval: "week" },
              product_data: { name: `LeanBox ${plan.name_zh} · ${plan.name_en}`, metadata: { plan_id: plan.id } },
            },
            quantity: 1,
          },
    ];
  } else {
    cartId = await getActiveCartId(supabase, user.id);
    const lines = await readCartLines(supabase, user.id);
    if (!cartId || !lines.length) return { error: "empty" };

    const { data: meals } = await admin
      .from("meals")
      .select("id, name_zh, name_en, price_cents, cost_cents, weekly_stock, is_active")
      .in("id", lines.map((l) => l.mealId));
    const byId = new Map((meals ?? []).map((m) => [m.id, m]));

    for (const line of lines) {
      const meal = byId.get(line.mealId);
      const name = meal ? (locale === "en" ? meal.name_en : meal.name_zh) : "—";
      if (!meal || !meal.is_active) return { error: "inactive", errorValues: { name } };
      if (line.quantity > meal.weekly_stock) return { error: "stock", errorValues: { name, count: meal.weekly_stock } };
      subtotal += meal.price_cents * line.quantity;
      items.push({
        meal_id: meal.id,
        name_snapshot: meal.name_zh,
        name_en_snapshot: meal.name_en,
        quantity: line.quantity,
        unit_price_cents: meal.price_cents,
        unit_cost_cents: meal.cost_cents,
      });
      lineItems.push({
        price_data: {
          currency: "hkd",
          unit_amount: meal.price_cents,
          product_data: { name: `${meal.name_zh} · ${meal.name_en}`, metadata: { meal_id: meal.id } },
        },
        quantity: line.quantity,
      });
    }
    delivery = deliveryFeeCents(subtotal);
    if (delivery > 0) {
      lineItems.push({
        price_data: { currency: "hkd", unit_amount: delivery, product_data: { name: "運費 · Delivery" } },
        quantity: 1,
      });
    }
  }

  // Remember delivery details for next time.
  if (input.saveDefault) {
    await supabase
      .from("profiles")
      .update({
        full_name: input.name,
        phone: input.phone,
        district: input.district,
        address_line: input.address,
        notes: input.notes ?? null,
      })
      .eq("id", user.id);
  }

  const stripe = getStripe();

  // Only one open checkout at a time: expire earlier unpaid sessions.
  const { data: pending } = await admin
    .from("orders")
    .select("id, stripe_checkout_session_id")
    .eq("user_id", user.id)
    .eq("status", "pending_payment");
  for (const p of pending ?? []) {
    if (p.stripe_checkout_session_id) {
      try {
        await stripe.checkout.sessions.expire(p.stripe_checkout_session_id);
      } catch {
        /* already expired / completed — webhook will reconcile */
      }
    }
    await admin
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", p.id)
      .eq("status", "pending_payment");
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      cart_id: cartId,
      plan_id: planId,
      kind: input.mode === "plan" ? "subscription" : "one_time",
      fulfillment_week: input.week,
      subtotal_cents: subtotal,
      delivery_cents: delivery,
      discount_cents: 0,
      total_cents: subtotal + delivery,
      customer_email: user.email ?? profile?.contact_email ?? null,
      delivery_name: input.name,
      delivery_phone: input.phone,
      delivery_district: input.district,
      delivery_address: input.address,
      delivery_notes: input.notes ?? null,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) {
    console.error("[checkout] order insert failed", orderError);
    return { error: "stripe" };
  }
  const { error: itemsError } = await admin.from("order_items").insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) {
    console.error("[checkout] order_items insert failed", itemsError);
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "stripe" };
  }

  let url: string | null = null;
  try {
    const customer = await ensureStripeCustomer(user, profile);
    const metadata = {
      order_id: order.id,
      user_id: user.id,
      cart_id: cartId ?? "",
      plan_id: planId ?? "",
      fulfillment_week: input.week,
    };
    const description = `LeanBox ${orderRef(order.order_number)} · ${input.week}`;
    const session = await stripe.checkout.sessions.create(
      {
        mode: input.mode === "plan" ? "subscription" : "payment",
        customer,
        line_items: lineItems,
        locale: locale === "en" ? "en" : "zh-HK",
        client_reference_id: order.id,
        metadata,
        success_url: siteUrl("/account/orders?success=1&session_id={CHECKOUT_SESSION_ID}"),
        cancel_url: siteUrl(input.mode === "plan" ? `/checkout?plan=${planId}` : "/checkout"),
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        ...(input.mode === "plan"
          ? { subscription_data: { metadata, description } }
          : { payment_intent_data: { metadata, description } }),
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
    await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    url = session.url;
  } catch (err) {
    console.error("[checkout] Stripe session failed", err);
    await admin.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString(), payment_error: "checkout_session_failed" }).eq("id", order.id);
    return { error: "stripe" };
  }

  if (!url) return { error: "stripe" };
  redirect(url);
}
