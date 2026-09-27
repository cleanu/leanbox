export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function trimEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function emailError(email, copy) {
  const value = trimEmail(email);
  if (!value) return copy.authNeedEmail;
  if (!EMAIL_RE.test(value)) return copy.authInvalidEmail;
  return "";
}

export function passwordStrength(password) {
  const value = String(password || "");
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  else if (/[a-zA-Z]/.test(value)) score += 0.5;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (score <= 1.5) return "weak";
  if (score <= 3) return "ok";
  return "strong";
}

export function passwordError(password, copy) {
  const value = String(password || "");
  if (!value) return copy.authNeedPassword;
  if (value.length < 8) return copy.authPasswordShort;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return copy.authPasswordWeak;
  return "";
}

export function confirmError(password, confirm, copy) {
  if (!confirm) return copy.authNeedConfirm;
  if (password !== confirm) return copy.authPasswordMismatch;
  return "";
}

export function mapAuthError(err, copy) {
  const raw = String(err?.message || err || "").toLowerCase();
  if (raw.includes("invalid login")) return copy.authBadCredentials;
  if (raw.includes("email not confirmed")) return copy.authEmailUnconfirmed;
  if (raw.includes("already registered") || raw.includes("already been registered")) return copy.authAlreadyRegistered;
  if (raw.includes("user not found")) return copy.authUserNotFound;
  if (raw.includes("password")) return copy.authPasswordRejected;
  if (raw.includes("rate") || raw.includes("too many")) return copy.authRateLimited;
  if (raw.includes("expired") || raw.includes("invalid")) return copy.authLinkExpired;
  return err?.message || copy.authFailed;
}

export function authRedirect(path = "/") {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
}
