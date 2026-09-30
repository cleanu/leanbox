"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mapAuthError, type AuthErrorKey } from "@/lib/auth/errors";
import { RECOVERY_COOKIE } from "@/lib/auth/recovery";
import { syncProfileAfterSignIn } from "@/lib/auth/session";
import { isSupabaseConfigured, safeNext, siteUrl } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, fieldErrors, forgotSchema, loginSchema, resetSchema, signupSchema } from "@/lib/validation";

export type AuthFormState = {
  status: "idle" | "error" | "verify" | "sent";
  error?: AuthErrorKey;
  fields?: Record<string, AuthErrorKey>;
  email?: string;
  name?: string;
};

const notConfigured: AuthFormState = { status: "error", error: "generic" };

function callbackUrl(next: string) {
  return siteUrl(`/auth/callback?next=${encodeURIComponent(next)}`);
}

// ---------------------------------------------------------------------------
// Email + password sign-in
// ---------------------------------------------------------------------------
export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const email = String(formData.get("email") ?? "");
  if (!(await rateLimit("login", { limit: 8, windowMs: 60_000 }))) return { status: "error", error: "tooManyAttempts", email };

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error) as AuthFormState["fields"], email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { status: "error", error: mapAuthError(error), email: parsed.data.email };

  await syncProfileAfterSignIn(data.user);
  redirect(safeNext(parsed.data.next, "/account"));
}

// ---------------------------------------------------------------------------
// Sign-up (email verification required by default)
// ---------------------------------------------------------------------------
export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!(await rateLimit("signup", { limit: 5, windowMs: 10 * 60_000 }))) return { status: "error", error: "tooManyAttempts", email, name };

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error) as AuthFormState["fields"], email, name };

  const next = safeNext(parsed.data.next, "/account");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl(next),
      data: parsed.data.name ? { full_name: parsed.data.name } : undefined,
    },
  });
  if (error) return { status: "error", error: mapAuthError(error), email, name };

  // Email confirmation disabled in Supabase → we already have a session.
  if (data.session && data.user) {
    await syncProfileAfterSignIn(data.user);
    redirect(next);
  }
  // Note: for an already-registered email Supabase returns a user with no
  // identities and sends nothing — we show the same screen to avoid leaking
  // which emails exist.
  return { status: "verify", email: parsed.data.email };
}

export async function resendVerificationAction(email: string, next = "/account"): Promise<{ ok: boolean; error?: AuthErrorKey }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "generic" };
  if (!(await rateLimit("resend", { limit: 3, windowMs: 10 * 60_000 }))) return { ok: false, error: "tooManyAttempts" };
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "invalidEmail" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: callbackUrl(safeNext(next, "/account")) },
  });
  if (error && mapAuthError(error) === "tooManyAttempts") return { ok: false, error: "tooManyAttempts" };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  if (!(await rateLimit("forgot", { limit: 5, windowMs: 10 * 60_000 }))) return { status: "error", error: "tooManyAttempts" };
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error) as AuthFormState["fields"] };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/reset-password"),
  });
  if (error) console.warn("[auth] resetPasswordForEmail:", error.code ?? error.message);
  // Always the same response, whether or not the email exists.
  return { status: "sent", email: parsed.data.email };
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfigured;
  const store = await cookies();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!store.get(RECOVERY_COOKIE) || !userData.user) redirect("/reset-password?error=expired");

  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error) as AuthFormState["fields"] };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", error: mapAuthError(error) };

  store.delete(RECOVERY_COOKIE);
  await syncProfileAfterSignIn(userData.user);
  redirect("/account?password=updated");
}
