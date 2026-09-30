"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { resetPasswordAction, type AuthFormState } from "@/actions/auth";
import { FieldError, FormAlert, Label, SubmitButton } from "@/components/ui/form";
import { PasswordInput } from "./password-input";

export function ResetForm() {
  const t = useTranslations("auth");
  const [state, action] = useActionState<AuthFormState, FormData>(resetPasswordAction, { status: "idle" });
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <FormAlert>{t(`errors.${state.error}`)}</FormAlert> : null}
      <div>
        <Label htmlFor="password" hint={t("passwordHint")}>
          {t("newPassword")}
        </Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required aria-invalid={Boolean(f.password)} aria-describedby={f.password ? "password-error" : undefined} />
        <FieldError id="password-error">{f.password ? t(`errors.${f.password}`) : null}</FieldError>
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required aria-invalid={Boolean(f.confirmPassword)} aria-describedby={f.confirmPassword ? "confirm-error" : undefined} />
        <FieldError id="confirm-error">{f.confirmPassword ? t(`errors.${f.confirmPassword}`) : null}</FieldError>
      </div>
      <SubmitButton className="w-full" pendingLabel={t("submitting")}>
        {t("resetSubmit")}
      </SubmitButton>
    </form>
  );
}
