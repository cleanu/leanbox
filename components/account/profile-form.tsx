"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useTransition } from "react";
import { updateProfileAction, type ProfileState } from "@/actions/account";
import { FieldError, Label, SubmitButton, submitWithoutReset } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { REGIONS } from "@/lib/districts";

export function ProfileForm({
  defaults,
  showContactEmail,
}: {
  defaults: { full_name: string; phone: string; district: string; address_line: string; notes: string; contact_email: string };
  showContactEmail: boolean;
}) {
  const t = useTranslations("account");
  const tc = useTranslations("checkout");
  const common = useTranslations("common");
  const locale = useLocale();
  const { toast } = useToast();
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, { status: "idle" });
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "saved") toast(t("saved"));
    else if (state.status === "error" && !state.fields) toast(common("error"), "error");
  }, [state, t, toast, common]);

  const f = state.fields ?? {};
  const fieldMessage = (key: string) => {
    const code = f[key];
    if (!code) return null;
    if (code === "phone" || code === "district") return tc(`errors.${code}`);
    return common("error");
  };

  return (
    <form onSubmit={submitWithoutReset(action, startTransition)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div>
        <Label htmlFor="full_name">{t("fullName")}</Label>
        <input id="full_name" name="full_name" defaultValue={defaults.full_name} autoComplete="name" className="field" maxLength={80} />
      </div>
      <div>
        <Label htmlFor="phone">{t("phone")}</Label>
        <input id="phone" name="phone" type="tel" defaultValue={defaults.phone} autoComplete="tel" placeholder="+852 9123 4567" className="field" aria-invalid={Boolean(f.phone)} aria-describedby="p-phone-error" />
        <FieldError id="p-phone-error">{fieldMessage("phone")}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="district">{t("district")}</Label>
        <select id="district" name="district" defaultValue={defaults.district} className="field">
          <option value="">{tc("selectDistrict")}</option>
          {REGIONS.map((r) => (
            <optgroup key={r.id} label={locale === "en" ? r.en : r.zh}>
              {r.districts.map((d) => (
                <option key={d.zh} value={`${r.id}/${d.zh}`}>
                  {locale === "en" ? d.en : d.zh}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="address_line">{t("address")}</Label>
        <input id="address_line" name="address_line" defaultValue={defaults.address_line} autoComplete="street-address" placeholder={tc("addressPlaceholder")} className="field" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <textarea id="notes" name="notes" rows={2} defaultValue={defaults.notes} placeholder={tc("notesPlaceholder")} className="field resize-none" maxLength={300} />
      </div>
      {showContactEmail ? (
        <div className="sm:col-span-2">
          <Label htmlFor="contact_email">{t("contactEmail")}</Label>
          <input id="contact_email" name="contact_email" type="email" defaultValue={defaults.contact_email} autoComplete="email" className="field" />
        </div>
      ) : (
        <input type="hidden" name="contact_email" value={defaults.contact_email} />
      )}
      <div className="sm:col-span-2">
        <SubmitButton size="md" pendingLabel={common("saving")} pending={pending}>
          {t("save")}
        </SubmitButton>
      </div>
    </form>
  );
}
