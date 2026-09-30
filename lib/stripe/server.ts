import "server-only";
import type { User } from "@supabase/supabase-js";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";
import type { Profile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

let client: Stripe | null = null;

/** Server-side Stripe client (API version pinned by the SDK). */
export function getStripe(): Stripe {
  if (!serverEnv.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) {
    client = new Stripe(serverEnv.stripeSecretKey, {
      appInfo: { name: "LeanBox", version: "1.0.0" },
      maxNetworkRetries: 2,
    });
  }
  return client;
}

/** Returns the user's Stripe Customer id, creating and storing one if needed. */
export async function ensureStripeCustomer(user: User, profile: Profile | null): Promise<string> {
  const stripe = getStripe();
  const admin = createAdminClient();
  if (profile?.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!("deleted" in existing && existing.deleted)) return profile.stripe_customer_id;
    } catch {
      // Customer from another Stripe account/mode (e.g. switched test → live) — recreate below.
    }
  }
  const customer = await stripe.customers.create(
    {
      email: user.email || profile?.contact_email || undefined,
      name: profile?.full_name || undefined,
      phone: profile?.phone || undefined,
      preferred_locales: ["zh-HK", "en"],
      metadata: { user_id: user.id },
    },
    { idempotencyKey: `customer-${user.id}-${profile?.stripe_customer_id ?? "new"}` },
  );
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", user.id);
  return customer.id;
}

export function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}
