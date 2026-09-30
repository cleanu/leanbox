"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { FieldError, FormAlert, Label, SubmitButton } from "@/components/ui/form";
import type { AuthErrorKey } from "@/lib/auth/errors";
import { OAuthButtons, OrDivider } from "./oauth-buttons";
import { PasswordInput } from "./password-input";
import { ResendButton } from "./resend-button";

export function LoginForm({
  next,
  providers,
  initialError,
}: {
  next: string;
  providers: { apple: boolean; google: boolean; email: boolean };
  initialError?: AuthErrorKey;
}) {
  const t = useTranslations("auth");
  const [state, action] = useActionState<AuthFormState, FormData>(loginAction, {
    status: initialError ? "error" : "idle",
    error: initialError,
  });
  const [oauthError, setOauthError] = useState<string | null>(null);
  const errorKey = state.error;

  return (
    <div>
      <OAuthButtons providers={providers} next={next} mode="login" onError={setOauthError} />
      {providers.apple || providers.google ? <OrDivider label={t("or")} /> : null}

      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        {oauthError ? <FormAlert>{oauthError}</FormAlert> : null}
        {errorKey ? (
          <FormAlert>
            <p>{t(`errors.${errorKey}`)}</p>
            {errorKey === "emailNotConfirmed" && state.email ? (
              <div className="mt-3">
                <ResendButton email={state.email} next={next} />
              </div>
            ) : null}
          </FormAlert>
        ) : null}

        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.email}
            className="field"
            aria-invalid={Boolean(state.fields?.email)}
            aria-describedby={state.fields?.email ? "email-error" : undefined}
          />
          <FieldError id="email-error">{state.fields?.email ? t(`errors.${state.fields.email}`) : null}</FieldError>
        </div>

        <div>
          <Label
            htmlFor="password"
            hint={
              <Link href="/forgot-password" className="link-underline text-olive-2">
                {t("forgot")}
              </Link>
            }
          >
            {t("password")}
          </Label>
          <PasswordInput id="password" name="password" autoComplete="current-password" required aria-invalid={Boolean(state.fields?.password)} />
        </div>

        <SubmitButton className="w-full" pendingLabel={t("submitting")}>
          {t("loginWithEmail")}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-mute">
        <Link href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-underline text-ink">
          {t("noAccount")}
        </Link>
      </p>
    </div>
  );
}
