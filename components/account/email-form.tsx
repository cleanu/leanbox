"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updateEmailAction } from "@/actions/account";
import { FormAlert, Label, SubmitButton } from "@/components/ui/form";

export function EmailForm({ current }: { current: string | null }) {
  const t = useTranslations("account");
  const ta = useTranslations("auth");
  const [state, action] = useActionState(updateEmailAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.ok ? <FormAlert tone="success">{t("addEmailSent")}</FormAlert> : null}
      {state.error ? <FormAlert>{ta(`errors.${state.error as "generic"}`)}</FormAlert> : null}
      <div>
        <Label htmlFor="new-email">{ta("email")}</Label>
        <input id="new-email" name="email" type="email" autoComplete="email" defaultValue={current ?? ""} className="field" />
      </div>
      <SubmitButton size="md" variant="outline" pendingLabel={ta("submitting")}>
        {t("addEmail")}
      </SubmitButton>
    </form>
  );
}
