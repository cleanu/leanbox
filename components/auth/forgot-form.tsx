"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/actions/auth";
import { FieldError, FormAlert, Label, SubmitButton } from "@/components/ui/form";

export function ForgotForm() {
  const t = useTranslations("auth");
  const [state, action] = useActionState<AuthFormState, FormData>(forgotPasswordAction, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="space-y-6">
        <div className="grid size-14 place-items-center rounded-full bg-olive-soft text-olive">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <p className="font-serif text-2xl leading-snug">{t("forgotSent")}</p>
        <p className="text-sm text-mute">{t("forgotSentHint")}</p>
        <p className="border-t border-line pt-6 text-sm">
          <Link href="/login" className="link-underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <FormAlert>{t(`errors.${state.error}`)}</FormAlert> : null}
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="field"
          aria-invalid={Boolean(state.fields?.email)}
          aria-describedby={state.fields?.email ? "email-error" : undefined}
        />
        <FieldError id="email-error">{state.fields?.email ? t(`errors.${state.fields.email}`) : null}</FieldError>
      </div>
      <SubmitButton className="w-full" pendingLabel={t("submitting")}>
        {t("forgotSubmit")}
      </SubmitButton>
      <p className="pt-2 text-center text-sm">
        <Link href="/login" className="link-underline text-mute hover:text-ink">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
