import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { isServiceRoleConfigured, isStripeWebhookConfigured, serverEnv } from "@/lib/env.server";
import { attachInvoicePaymentIntent, createRenewalOrder, fulfillCheckoutSession, syncSubscription } from "@/lib/orders/fulfill";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, idOf } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Verifies the signature against the *raw* body, records the
 * event id for idempotency and dispatches. Handlers are idempotent on their
 * own too, so Stripe retries are harmless.
 *
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.expired, payment_intent.payment_failed, charge.refunded,
 * invoice.paid, customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(request: NextRequest) {
  if (!isStripeWebhookConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, serverEnv.stripeWebhookSecret);
  } catch (err) {
    console.warn("[stripe] signature verification failed", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: seen } = await admin.from("stripe_events").select("processed_at").eq("id", event.id).maybeSingle();
  if (seen?.processed_at) return NextResponse.json({ received: true, duplicate: true });
  if (!seen) await admin.from("stripe_events").upsert({ id: event.id, type: event.type }, { onConflict: "id", ignoreDuplicates: true });

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`[stripe] ${event.type} ${event.id} failed`, err);
    // 500 → Stripe retries with backoff.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  await admin.from("stripe_events").update({ processed_at: new Date().toISOString() }).eq("id", event.id);
  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      await fulfillCheckoutSession(event.data.object);
      return;
    }

    case "checkout.session.expired": {
      const orderId = event.data.object.metadata?.order_id;
      if (orderId) {
        await admin
          .from("orders")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("status", "pending_payment");
      }
      return;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        // Keep the order pending (the customer can retry in Checkout); record why.
        await admin
          .from("orders")
          .update({ payment_error: pi.last_payment_error?.message ?? pi.last_payment_error?.code ?? "payment_failed" })
          .eq("id", orderId)
          .eq("status", "pending_payment");
      }
      return;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const pi = idOf(charge.payment_intent);
      if (!pi) return;
      const full = charge.refunded || charge.amount_refunded >= charge.amount;
      await admin
        .from("orders")
        .update({
          refunded_cents: charge.amount_refunded,
          ...(full ? { status: "refunded" as const, refunded_at: new Date().toISOString() } : {}),
        })
        .eq("stripe_payment_intent_id", pi);
      return;
    }

    case "invoice.paid": {
      const invoice = event.data.object;
      if (invoice.billing_reason === "subscription_cycle") await createRenewalOrder(invoice);
      else if (invoice.billing_reason === "subscription_create" && invoice.id) await attachInvoicePaymentIntent(invoice.id);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object);
      return;
    }

    default:
      return;
  }
}
