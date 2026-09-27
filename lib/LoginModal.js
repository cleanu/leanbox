"use client";

import { useEffect, useState } from "react";
import { LOGO_MARK } from "./logo";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export default function LoginModal({ copy, onClose, onSignedIn }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    const supabase = getSupabase();
    if (!supabase) {
      setError(copy.authMissing);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (err) throw err;
        setMessage(copy.authCheckEmail);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onSignedIn?.();
        onClose();
      }
    } catch (err) {
      setError(err.message || copy.authFailed);
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    setError("");
    setMessage("");
    const supabase = getSupabase();
    if (!supabase) {
      setError(copy.authMissing);
      return;
    }
    if (!email) {
      setError(copy.authNeedEmail);
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) throw err;
      setMessage(copy.authCheckEmail);
    } catch (err) {
      setError(err.message || copy.authFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img src={LOGO_MARK} alt="LeanBox" className="modal-logo" />
        <h2 id="login-title">{mode === "signup" ? copy.authSignupTitle : copy.authLoginTitle}</h2>
        <p className="auth-lead">{copy.authLead}</p>
        {!isSupabaseConfigured() ? <p className="err">{copy.authMissing}</p> : null}
        <form className="auth-form" onSubmit={submit}>
          <label>
            {copy.authEmail}
            <input type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            {copy.authPassword}
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="err">{error}</p> : null}
          {message ? <p className="ok">{message}</p> : null}
          <button className="order-now solid" type="submit" disabled={busy}>
            {busy ? copy.opening : mode === "signup" ? copy.authCreate : copy.authLogin}
          </button>
          <button className="text-link" type="button" onClick={magicLink} disabled={busy}>
            {copy.authMagic}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "signup" ? copy.authHaveAccount : copy.authNoAccount}{" "}
          <button type="button" className="text-link" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
            {mode === "signup" ? copy.authLogin : copy.authCreate}
          </button>
        </p>
      </div>
    </div>
  );
}
