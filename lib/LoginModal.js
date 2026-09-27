"use client";

import { useEffect, useMemo, useState } from "react";
import { LOGO_MARK } from "./logo";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import {
  authRedirect,
  confirmError,
  emailError,
  mapAuthError,
  passwordError,
  passwordStrength,
  trimEmail,
} from "./auth";

function Field({ label, error, children }) {
  return (
    <label className={error ? "has-error" : ""}>
      {label}
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

function PasswordInput({ value, onChange, autoComplete, showLabel, hideLabel }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} tabIndex={-1}>
        {show ? hideLabel : showLabel}
      </button>
    </div>
  );
}

export default function LoginModal({ copy, initialMode = "signin", onClose, onSignedIn }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  useEffect(() => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setTouched({});
    setPassword("");
    setConfirm("");
  }, [mode]);

  const strength = useMemo(() => passwordStrength(password), [password]);

  function validate(nextMode = mode) {
    const next = {};
    if (nextMode !== "reset") {
      const mailErr = emailError(email, copy);
      if (mailErr) next.email = mailErr;
    }
    if (nextMode === "signin" || nextMode === "signup" || nextMode === "reset") {
      const pwErr = passwordError(password, copy);
      if (nextMode === "signin") {
        if (!password) next.password = copy.authNeedPassword;
      } else if (pwErr) {
        next.password = pwErr;
      }
    }
    if (nextMode === "signup" || nextMode === "reset") {
      const matchErr = confirmError(password, confirm, copy);
      if (matchErr) next.confirm = matchErr;
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setTouched({ email: true, password: true, confirm: true });
    if (!validate(mode)) return;

    const supabase = getSupabase();
    if (!supabase) {
      setError(copy.authMissing);
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: trimEmail(email),
          password,
          options: { emailRedirectTo: authRedirect("/") },
        });
        if (err) throw err;
        if (data.session) {
          onSignedIn?.();
          onClose();
          return;
        }
        setMode("sent");
        setMessage(copy.authCheckEmailSignup);
        return;
      }

      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(trimEmail(email), {
          redirectTo: authRedirect("/reset"),
        });
        if (err) throw err;
        setMode("sent");
        setMessage(copy.authCheckEmailReset);
        return;
      }

      if (mode === "reset") {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        setMessage(copy.authPasswordUpdated);
        setTimeout(() => {
          onSignedIn?.();
          onClose();
        }, 700);
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email: trimEmail(email),
        password,
      });
      if (err) throw err;
      onSignedIn?.();
      onClose();
    } catch (err) {
      setError(mapAuthError(err, copy));
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    setError("");
    setMessage("");
    setTouched((prev) => ({ ...prev, email: true }));
    const mailErr = emailError(email, copy);
    if (mailErr) {
      setFieldErrors({ email: mailErr });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError(copy.authMissing);
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: trimEmail(email),
        options: { emailRedirectTo: authRedirect("/") },
      });
      if (err) throw err;
      setMode("sent");
      setMessage(copy.authCheckEmail);
    } catch (err) {
      setError(mapAuthError(err, copy));
    } finally {
      setBusy(false);
    }
  }

  const titles = {
    signin: copy.authLoginTitle,
    signup: copy.authSignupTitle,
    forgot: copy.authForgotTitle,
    reset: copy.authResetTitle,
    sent: copy.authCheckTitle,
  };
  const leads = {
    signin: copy.authLead,
    signup: copy.authSignupLead,
    forgot: copy.authForgotLead,
    reset: copy.authResetLead,
    sent: message || copy.authCheckEmail,
  };

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
        <h2 id="login-title">{titles[mode]}</h2>
        <p className="auth-lead">{leads[mode]}</p>
        {!isSupabaseConfigured() ? <p className="err">{copy.authMissing}</p> : null}

        {mode === "sent" ? (
          <div className="auth-sent">
            <p className="ok">{message || copy.authCheckEmail}</p>
            <button className="order-now solid" type="button" onClick={() => setMode("signin")}>
              {copy.authBackToLogin}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {mode !== "reset" ? (
              <Field label={copy.authEmail} error={touched.email ? fieldErrors.email : ""}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }));
                    setFieldErrors((prev) => ({ ...prev, email: emailError(email, copy) }));
                  }}
                />
              </Field>
            ) : null}

            {mode !== "forgot" ? (
              <Field label={mode === "reset" ? copy.authNewPassword : copy.authPassword} error={touched.password ? fieldErrors.password : ""}>
                <PasswordInput
                  value={password}
                  autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"}
                  onChange={(e) => setPassword(e.target.value)}
                  showLabel={copy.authShow}
                  hideLabel={copy.authHide}
                />
              </Field>
            ) : null}

            {mode === "signup" || mode === "reset" ? (
              <>
                <div className={`pw-meter ${strength}`}>
                  <span />
                  <span />
                  <span />
                  <em>
                    {strength === "strong" ? copy.authPwStrong : strength === "ok" ? copy.authPwOk : copy.authPwWeak}
                  </em>
                </div>
                <p className="pw-hint">{copy.authPasswordHint}</p>
                <Field label={copy.authConfirmPassword} error={touched.confirm ? fieldErrors.confirm : ""}>
                  <PasswordInput
                    value={confirm}
                    autoComplete="new-password"
                    onChange={(e) => setConfirm(e.target.value)}
                    showLabel={copy.authShow}
                    hideLabel={copy.authHide}
                  />
                </Field>
              </>
            ) : null}

            {error ? <p className="err">{error}</p> : null}
            {message && mode !== "sent" ? <p className="ok">{message}</p> : null}

            <button className="order-now solid" type="submit" disabled={busy}>
              {busy
                ? copy.opening
                : mode === "signup"
                  ? copy.authCreate
                  : mode === "forgot"
                    ? copy.authSendReset
                    : mode === "reset"
                      ? copy.authSavePassword
                      : copy.authLogin}
            </button>

            {mode === "signin" ? (
              <>
                <button className="ghost-link" type="button" onClick={magicLink} disabled={busy}>
                  {copy.authMagic}
                </button>
                <button className="ghost-link" type="button" onClick={() => setMode("forgot")}>
                  {copy.authForgot}
                </button>
              </>
            ) : null}
          </form>
        )}

        {mode === "signin" ? (
          <p className="auth-switch">
            <span>{copy.authNoAccount}</span>
            <button type="button" className="text-link" onClick={() => setMode("signup")}>
              {copy.authCreate}
            </button>
          </p>
        ) : null}
        {mode === "signup" || mode === "forgot" ? (
          <p className="auth-switch">
            <span>{copy.authHaveAccount}</span>
            <button type="button" className="text-link" onClick={() => setMode("signin")}>
              {copy.authLogin}
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
