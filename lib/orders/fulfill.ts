import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, idOf } from "@/lib/stripe/server";
import { openDeliveryWeeks } from "@/lib/weeks";

/**
 * Marks the order behind a paid Checkout Session as paid (idempotent — safe
 * to call from both the webhook and the success page).
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId) return false;
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return false;

  const admin = createAdminClient();
  // KOL codes: record what Stripe actually discounted and charged.
  const discount = session.total_details?.amount_discount ?? 0;
  if (discount > 0 && session.amount_total != null) {
    await admin.from("orders").update({ discount_cents: discount, total_cents: session.amount_total }).eq("id", orderId);
  }

  const subscriptionId = idOf(session.subscription);
  const { data: fulfilled, error } = await admin.rpc("fulfill_order", {
    p_order_id: orderId,
    p_payment_intent: idOf(session.payment_intent),
    p_subscription: subscriptionId,
  });
  if (error) throw error;

  if (subscriptionId) {
    const invoiceId = idOf(session.invoice);
    if (invoiceId) {
      await admin.from("orders").update({ stripe_invoice_id: invoiceId }).eq("id", orderId).is("stripe_invoice_id", null);
      await attachInvoicePaymentIntent(invoiceId);
    }
    await syncSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
  }
  return Boolean(fulfilled);
}

/** Mirror a Stripe subscription into public.subscriptions. */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const periodEnd = sub.items.data[0]?.current_period_end;
  const { error } = await admin.from("subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: idOf(sub.customer),
      user_id: sub.metadata?.user_id || null,
      plan_id: sub.metadata?.plan_id || null,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw error;
}

/**
 * invoice.paid for a renewal (billing_reason = subscription_cycle): create the
 * next week's plan order, copying delivery details from the latest order of
 * that subscription. Unique stripe_invoice_id keeps this idempotent.
 */
export async function createRenewalOrder(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId || invoice.billing_reason !== "subscription_cycle") return;

  const admin = createAdminClient();
  const { data: existing } = await admin.from("orders").select("id").eq("stripe_invoice_id", invoice.id).maybeSingle();
  if (existing) return;

  const { data: previous } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("stripe_subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!previous) {
    console.warn("[fulfill] renewal without a previous order", subscriptionId);
    return;
  }

  const planItem = previous.order_items.find((i) => i.plan_id);
  const { data: plan } = previous.plan_id
    ? await admin.from("plans").select("*").eq("id", previous.plan_id).maybeSingle()
    : { data: null };
  const amount = invoice.amount_paid;
  // KOL coupons discount every week; keep the pre-discount price on the order, like first orders.
  const discount = (invoice.total_discount_amounts ?? []).reduce((sum, d) => sum + d.amount, 0);
  const [week] = openDeliveryWeeks(new Date(), 1);

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: previous.user_id,
      plan_id: previous.plan_id,
      kol_code_id: discount > 0 ? previous.kol_code_id : null,
      kind: "subscription",
      fulfillment_week: week.id,
      subtotal_cents: amount + discount,
      discount_cents: discount,
      total_cents: amount,
      customer_email: previous.customer_email,
      stripe_subscription_id: subscriptionId,
      stripe_invoice_id: invoice.id,
      delivery_name: previous.delivery_name,
      delivery_phone: previous.delivery_phone,
      delivery_district: previous.delivery_district,
      delivery_address: previous.delivery_address,
      delivery_notes: previous.delivery_notes,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return; // raced with another delivery of the same event
    throw error;
  }

  await admin.from("order_items").insert({
    order_id: order.id,
    plan_id: previous.plan_id,
    name_snapshot: plan?.name_zh ?? planItem?.name_snapshot ?? "每週計劃",
    name_en_snapshot: plan?.name_en ?? planItem?.name_en_snapshot ?? "Weekly plan",
    quantity: 1,
    unit_price_cents: amount + discount,
    unit_cost_cents: plan?.cost_cents ?? planItem?.unit_cost_cents ?? 0,
  });

  const paymentIntent = await invoicePaymentIntent(invoice.id);
  await admin.rpc("fulfill_order", { p_order_id: order.id, p_payment_intent: paymentIntent, p_subscription: subscriptionId });
}

/** First-invoice PaymentIntent, so refunds on subscription orders can be matched. */
export async function attachInvoicePaymentIntent(invoiceId: string): Promise<void> {
  const pi = await invoicePaymentIntent(invoiceId);
  if (!pi) return;
  const admin = createAdminClient();
  await admin.from("orders").update({ stripe_payment_intent_id: pi }).eq("stripe_invoice_id", invoiceId).is("stripe_payment_intent_id", null);
}

async function invoicePaymentIntent(invoiceId: string | undefined): Promise<string | null> {
  if (!invoiceId) return null;
  try {
    const inv = await getStripe().invoices.retrieve(invoiceId, { expand: ["payments"] });
    const payment = inv.payments?.data.find((p) => p.status === "paid") ?? inv.payments?.data[0];
    return idOf(payment?.payment.payment_intent ?? null);
  } catch {
    return null;
  }
}
