import type { AuthError } from "@supabase/supabase-js";

export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "tooManyAttempts"
  | "passwordMismatch"
  | "passwordTooShort"
  | "weakPassword"
  | "samePassword"
  | "invalidEmail"
  | "signupDisabled"
  | "oauthFailed"
  | "callbackFailed"
  | "generic";

/** Map Supabase Auth error codes to our zh-HK / en message keys. */
export function mapAuthError(error: Pick<AuthError, "code" | "status" | "message"> | null | undefined): AuthErrorKey {
  if (!error) return "generic";
  const code = error.code ?? "";
  if (error.status === 429 || code.startsWith("over_") || code === "too_many_requests") return "tooManyAttempts";
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "weak_password":
      return "weakPassword";
    case "same_password":
      return "samePassword";
    case "email_address_invalid":
    case "validation_failed":
      return "invalidEmail";
    case "signup_disabled":
    case "email_provider_disabled":
      return "signupDisabled";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return "callbackFailed";
  }
  if (/invalid login credentials/i.test(error.message)) return "invalidCredentials";
  if (/email not confirmed/i.test(error.message)) return "emailNotConfirmed";
  return "generic";
}
