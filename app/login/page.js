"use client";

import { useEffect, useState } from "react";
import { LOGO_MARK } from "../../lib/logo";
import { DEFAULT_LANG, readLang, writeLang, t } from "../../lib/i18n";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabase";

export default function LoginPage() {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const copy = t(lang);

  useEffect(() => setLang(writeLang(readLang())), []);

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
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) throw err;
        setMessage(copy.authCheckEmail);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = "/";
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
    <main className="auth-page">
      <a className="brand" href="/">
        <img src={LOGO_MARK} alt="LeanBox" />
      </a>
      <h1>{mode === "signup" ? copy.authSignupTitle : copy.authLoginTitle}</h1>
      <p className="auth-lead">{copy.authLead}</p>
      {!isSupabaseConfigured() ? <p className="err">{copy.authMissing}</p> : null}
      <form className="auth-form" onSubmit={submit}>
        <label>
          {copy.authEmail}
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {copy.authPassword}
          <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
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
      <a className="text-link" href="/">{copy.authBack}</a>
    </main>
  );
}
