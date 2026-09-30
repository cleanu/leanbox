import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { RECOVERY_COOKIE, RECOVERY_MAX_AGE } from "@/lib/auth/recovery";
import { syncProfileAfterSignIn } from "@/lib/auth/session";
import { isSupabaseConfigured, safeNext } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Handles every redirect back from Supabase Auth:
 *  - OAuth (Google / Apple) and PKCE email links → ?code=…
 *  - token_hash email templates                  → ?token_hash=…&type=…
 *  - errors (expired links, cancelled consent)   → ?error=…&error_code=…
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;
  const next = safeNext(url.searchParams.get("next"), "/account");
  const type = url.searchParams.get("type");
  const isRecovery = type === "recovery" || next === "/reset-password";

  const fail = (reason: "expired" | "oauth" | "callback") => {
    if (isRecovery) return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    const key = reason === "oauth" ? "oauthFailed" : "callbackFailed";
    return NextResponse.redirect(`${origin}/login?error=${key}&next=${encodeURIComponent(next)}`);
  };

  if (!isSupabaseConfigured()) return NextResponse.redirect(`${origin}/setup`);

  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    const code = url.searchParams.get("error_code");
    return fail(code === "otp_expired" ? "expired" : errorParam === "access_denied" && !code ? "oauth" : "callback");
  }

  const supabase = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.warn("[auth/callback] exchangeCodeForSession:", error.code ?? error.message);
  } else if (tokenHash && type && OTP_TYPES.includes(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    ok = !error;
    if (error) console.warn("[auth/callback] verifyOtp:", error.code ?? error.message);
  }
  if (!ok) return fail("callback");

  const { data } = await supabase.auth.getUser();
  if (data.user) await syncProfileAfterSignIn(data.user);

  const response = NextResponse.redirect(`${origin}${next}`);
  if (isRecovery) {
    response.cookies.set(RECOVERY_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RECOVERY_MAX_AGE,
    });
  }
  return response;
}
