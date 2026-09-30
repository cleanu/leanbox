"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { signupAction, type AuthFormState } from "@/actions/auth";
import { FieldError, FormAlert, Label, SubmitButton } from "@/components/ui/form";
import { OAuthButtons, OrDivider } from "./oauth-buttons";
import { PasswordInput } from "./password-input";
import { ResendButton } from "./resend-button";

export function SignupForm({ next, providers }: { next: string; providers: { apple: boolean; google: boolean; email: boolean } }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action] = useActionState<AuthFormState, FormData>(signupAction, { status: "idle" });
  const [oauthError, setOauthError] = useState<string | null>(null);

  if (state.status === "verify" && state.email) {
    return (
      <div className="space-y-6">
        <div className="grid size-14 place-items-center rounded-full bg-olive-soft text-olive">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h2 className="text-3xl">{t("checkEmailTitle")}</h2>
        <p className="leading-relaxed text-walnut/85">{t("checkEmailBody", { email: state.email })}</p>
        <p className="text-sm text-mute">{t("checkEmailHint")}</p>
        <ResendButton email={state.email} next={next} />
        <p className="border-t border-line pt-6 text-sm">
          <Link href="/login" className="link-underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  const f = state.fields ?? {};
  const err = (k: string) => (f[k] ? t(`errors.${f[k]}`) : null);

  return (
    <div>
      <OAuthButtons providers={providers} next={next} mode="signup" onError={setOauthError} />
      {providers.apple || providers.google ? <OrDivider label={t("or")} /> : null}

      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        {oauthError ? <FormAlert>{oauthError}</FormAlert> : null}
        {state.error ? <FormAlert>{t(`errors.${state.error}`)}</FormAlert> : null}

        <div>
          <Label htmlFor="name" optional={tc("optional")}>
            {t("name")}
          </Label>
          <input id="name" name="name" autoComplete="name" defaultValue={state.name} className="field" maxLength={80} />
        </div>

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
            aria-invalid={Boolean(f.email)}
            aria-describedby={f.email ? "email-error" : undefined}
          />
          <FieldError id="email-error">{err("email")}</FieldError>
        </div>

        <div>
          <Label htmlFor="password" hint={t("passwordHint")}>
            {t("password")}
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(f.password)}
            aria-describedby={f.password ? "password-error" : undefined}
          />
          <FieldError id="password-error">{err("password")}</FieldError>
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(f.confirmPassword)}
            aria-describedby={f.confirmPassword ? "confirm-error" : undefined}
          />
          <FieldError id="confirm-error">{err("confirmPassword")}</FieldError>
        </div>

        <SubmitButton className="w-full" pendingLabel={t("submitting")}>
          {t("create")}
        </SubmitButton>
        <p className="text-center text-xs leading-relaxed text-mute">{t("terms")}</p>
      </form>

      <p className="mt-8 text-center text-sm text-mute">
        <Link href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-underline text-ink">
          {t("haveAccount")}
        </Link>
      </p>
    </div>
  );
}
