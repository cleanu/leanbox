import "server-only";
import { isSupabaseConfigured, publicEnv } from "./env";

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export function isServiceRoleConfigured(): boolean {
  return isSupabaseConfigured() && serverEnv.supabaseServiceRoleKey.length > 20;
}

export function isStripeConfigured(): boolean {
  // Require a real-looking key, so the empty "sk_test_" placeholder from .env.example doesn't count.
  return /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}/.test(serverEnv.stripeSecretKey);
}

export function isStripeWebhookConfigured(): boolean {
  return isStripeConfigured() && /^whsec_[A-Za-z0-9]{10,}/.test(serverEnv.stripeWebhookSecret);
}

export type EnvCheck = { key: string; ok: boolean; scope: "public" | "server"; hint: string };

export function envChecks(): EnvCheck[] {
  return [
    { key: "NEXT_PUBLIC_SUPABASE_URL", ok: /^https?:\/\//.test(publicEnv.supabaseUrl), scope: "public", hint: "Supabase → Project Settings → API → Project URL" },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: publicEnv.supabaseAnonKey.length > 20, scope: "public", hint: "Supabase → Project Settings → API Keys → anon / publishable key" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", ok: serverEnv.supabaseServiceRoleKey.length > 20, scope: "server", hint: "Supabase → API Keys → service_role / secret key (server only)" },
    { key: "NEXT_PUBLIC_SITE_URL", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL), scope: "public", hint: "http://localhost:3000 locally, your domain in production" },
    { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", ok: /^pk_(test|live)_[A-Za-z0-9]{10,}/.test(publicEnv.stripePublishableKey), scope: "public", hint: "Stripe → Developers → API keys → Publishable key" },
    { key: "STRIPE_SECRET_KEY", ok: isStripeConfigured(), scope: "server", hint: "Stripe → Developers → API keys → Secret key" },
    { key: "STRIPE_WEBHOOK_SECRET", ok: /^whsec_[A-Za-z0-9]{10,}/.test(serverEnv.stripeWebhookSecret), scope: "server", hint: "`stripe listen` output or Stripe → Webhooks → Signing secret" },
    { key: "ADMIN_EMAILS", ok: serverEnv.adminEmails.length > 0, scope: "server", hint: "Comma-separated emails promoted to admin on sign-in" },
  ];
}
