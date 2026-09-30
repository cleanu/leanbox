import "server-only";
import { isServiceRoleConfigured, isStripeConfigured } from "@/lib/env.server";
import { getStripe } from "@/lib/stripe/server";
import { fulfillCheckoutSession } from "./fulfill";

/**
 * Called when the customer lands on the success URL. Confirms the session
 * with Stripe and fulfils it (idempotent), so orders flip to "paid" even if
 * the webhook is delayed or not forwarded in local development.
 */
export async function syncReturnedCheckout(sessionId: string, userId: string): Promise<"paid" | "pending" | "ignored"> {
  if (!isStripeConfigured() || !isServiceRoleConfigured() || !/^cs_(test|live)_/.test(sessionId)) return "ignored";
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.user_id !== userId) return "ignored";
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
      await fulfillCheckoutSession(session);
      return "paid";
    }
    return "pending";
  } catch (err) {
    console.warn("[checkout] success sync failed", err);
    return "pending";
  }
}
