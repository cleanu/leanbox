import "server-only";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

export type AuthProviders = { email: boolean; google: boolean; apple: boolean };

/**
 * Reads which providers are enabled in Supabase (GET /auth/v1/settings), so
 * buttons for providers that aren't configured are hidden instead of failing.
 * Override with AUTH_PROVIDERS=google,apple (or "none") if needed.
 */
export async function getAuthProviders(): Promise<AuthProviders> {
  const override = process.env.AUTH_PROVIDERS;
  if (override !== undefined && override !== "") {
    const list = override.split(",").map((s) => s.trim().toLowerCase());
    return { email: true, google: list.includes("google"), apple: list.includes("apple") };
  }
  if (!isSupabaseConfigured()) return { email: false, google: false, apple: false };
  try {
    const res = await fetch(`${publicEnv.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: publicEnv.supabaseAnonKey },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { external?: Record<string, boolean>; disable_signup?: boolean };
    return {
      email: json.external?.email !== false,
      google: Boolean(json.external?.google),
      apple: Boolean(json.external?.apple),
    };
  } catch (err) {
    console.warn("[auth] could not read provider settings; hiding OAuth buttons", err);
    return { email: true, google: false, apple: false };
  }
}
