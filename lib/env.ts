/**
 * Public (browser-safe) environment. NEXT_PUBLIC_* values are inlined at build
 * time, so each one must be referenced literally.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};

export function isSupabaseConfigured(): boolean {
  return /^https?:\/\//.test(publicEnv.supabaseUrl) && publicEnv.supabaseAnonKey.length > 20;
}

/** Absolute URL on this site, used for OAuth / email / Stripe redirects. */
export function siteUrl(path = "/"): string {
  return `${publicEnv.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Only allow same-site relative redirects for ?next= to avoid open redirects.
 */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.startsWith("/auth/")) return fallback;
  return next;
}
