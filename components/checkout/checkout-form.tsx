"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useMemo, useState } from "react";
import { startCheckout, type CheckoutState } from "@/actions/checkout";
import { useCart } from "@/components/cart/cart-provider";
import { ButtonLink } from "@/components/ui/button";
import { FieldError, FormAlert, Label, SubmitButton } from "@/components/ui/form";
import type { PublicPlan } from "@/lib/catalog/types";
import { REGIONS, type Region } from "@/lib/districts";
import { cn } from "@/lib/utils";
import { formatWeekRange, formatHKT, type DeliveryWeek } from "@/lib/weeks";
import { OrderSummary } from "./order-summary";

export type CheckoutDefaults = {
  name: string;
  phone: string;
  district: string;
  address: string;
  notes: string;
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="flex items-baseline gap-4 text-2xl">
        <span className="numeral text-base text-saffron">{n}</span>
        {title}
      </h2>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function DeliveryFields({
  values,
  weeks,
  fields,
}: {
  values: CheckoutDefaults & { week?: string; saveDefault?: boolean };
  weeks: DeliveryWeek[];
  fields: CheckoutState["fields"];
}) {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const locale = useLocale();
  const initialRegion = values.district.split("/")[0];
  const [region, setRegion] = useState<Region | "">(REGIONS.some((r) => r.id === initialRegion) ? (initialRegion as Region) : "");
  const districts = useMemo(() => REGIONS.find((r) => r.id === region)?.districts ?? [], [region]);
  const f = fields ?? {};
  const err = (k: string) => (f[k] ? t(`errors.${f[k]!}`) : null);
  const selectedWeek = weeks.some((w) => w.id === values.week) ? values.week : weeks[0]?.id;

  return (
    <div className="space-y-12 lg:col-span-7">
      <Section n="01" title={t("deliveryTitle")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <input id="name" name="name" autoComplete="name" defaultValue={values.name} className="field" aria-invalid={Boolean(f.name)} aria-describedby="name-error" />
            <FieldError id="name-error">{err("name")}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">{t("phone")}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-mute">{t("phonePrefix")}</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                defaultValue={values.phone}
                placeholder="9123 4567"
                className="field pl-16"
                aria-invalid={Boolean(f.phone)}
                aria-describedby="phone-error"
              />
            </div>
            <FieldError id="phone-error">{err("phone")}</FieldError>
          </div>
          <div>
            <Label htmlFor="region">{t("region")}</Label>
            {/* Uncontrolled (defaultValue) so React's post-action form reset restores it correctly. */}
            <select id="region" defaultValue={region} onChange={(e) => setRegion(e.target.value as Region)} className="field">
              <option value="">{t("selectRegion")}</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {locale === "en" ? r.en : r.zh}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="district">{t("district")}</Label>
            <select
              id="district"
              name="district"
              key={region}
              defaultValue={values.district.startsWith(`${region}/`) ? values.district : ""}
              disabled={!region}
              className="field disabled:opacity-50"
              aria-invalid={Boolean(f.district)}
              aria-describedby="district-error"
            >
              <option value="">{t("selectDistrict")}</option>
              {districts.map((d) => (
                <option key={d.zh} value={`${region}/${d.zh}`}>
                  {locale === "en" ? d.en : d.zh}
                </option>
              ))}
            </select>
            <FieldError id="district-error">{err("district")}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">{t("address")}</Label>
            <input
              id="address"
              name="address"
              autoComplete="street-address"
              defaultValue={values.address}
              placeholder={t("addressPlaceholder")}
              className="field"
              aria-invalid={Boolean(f.address)}
              aria-describedby="address-error"
            />
            <FieldError id="address-error">{err("address")}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes" optional={tc("optional")}>
              {t("notes")}
            </Label>
            <textarea id="notes" name="notes" rows={2} defaultValue={values.notes} placeholder={t("notesPlaceholder")} className="field resize-none" maxLength={300} />
          </div>
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" name="saveDefault" defaultChecked={values.saveDefault ?? true} className="size-4 accent-olive" />
            {t("saveDefault")}
          </label>
        </div>
      </Section>

      <Section n="02" title={t("weekTitle")}>
        <fieldset>
          <legend className="sr-only">{t("weekTitle")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {weeks.map((w, i) => (
              <label
                key={w.id}
                className="group relative cursor-pointer rounded-2xl border border-line-strong bg-white/40 p-5 transition has-[:checked]:border-ink has-[:checked]:bg-white has-[:checked]:shadow-[0_16px_40px_-24px_rgba(22,19,16,0.5)]"
              >
                <input type="radio" name="week" value={w.id} defaultChecked={w.id === selectedWeek} className="peer sr-only" />
                <span className="absolute right-5 top-5 grid size-5 place-items-center rounded-full border border-line-strong peer-checked:border-ink peer-checked:bg-ink">
                  <span className="size-1.5 rounded-full bg-parchment" />
                </span>
                <span className="eyebrow">{i === 0 ? t("thisBatch") : t("nextBatch")}</span>
                <span className="mt-2 block font-serif text-xl">{t("weekRange", { range: formatWeekRange(w, locale) })}</span>
                <span className="mt-2 block text-xs text-mute">
                  {t("cutoffIn", { time: formatHKT(w.cutoffAt, locale, { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) })}
                </span>
              </label>
            ))}
          </div>
          <FieldError id="week-error">{err("week")}</FieldError>
        </fieldset>
      </Section>
    </div>
  );
}

export function CheckoutForm({
  plan,
  defaults,
  weeks,
  stripeReady,
}: {
  plan: PublicPlan | null;
  defaults: CheckoutDefaults;
  weeks: DeliveryWeek[];
  stripeReady: boolean;
}) {
  const t = useTranslations("checkout");
  const cart = useCart();
  const [state, action] = useActionState<CheckoutState, FormData>(startCheckout, {});

  const isEmpty = !plan && cart.count === 0;
  if (isEmpty && !cart.isSyncing) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-3xl">{t("emptyCart")}</p>
        <ButtonLink href="/menu" className="mt-8">
          {t("browse")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-14 lg:grid-cols-12" noValidate>
      <input type="hidden" name="mode" value={plan ? "plan" : "cart"} />
      <input type="hidden" name="planId" value={plan?.id ?? ""} />

      {/* Keyed by submission so fields re-mount with what was submitted after React resets the form. */}
      <DeliveryFields key={state.nonce ?? 0} values={state.values ?? defaults} weeks={weeks} fields={state.fields} />

      <aside className="lg:col-span-5">
        <div className="card-lux sticky top-[calc(var(--header-h)+1.5rem)] p-6 sm:p-8">
          <h2 className="flex items-baseline gap-4 text-2xl">
            <span className="numeral text-base text-saffron">03</span>
            {t("summaryTitle")}
          </h2>
          <div className="mt-6">
            <OrderSummary plan={plan} />
          </div>

          <div className="mt-6 space-y-4">
            {state.error ? (
              <FormAlert>{t(`errors.${state.error}`, { name: state.errorValues?.name ?? "", count: state.errorValues?.count ?? 0 })}</FormAlert>
            ) : null}
            {!stripeReady ? <FormAlert tone="info">{t("stripeMissing")}</FormAlert> : null}
            <SubmitButton className="w-full" pendingLabel={t("paying")} disabled={!stripeReady || cart.isSyncing}>
              <Lock className="size-4" aria-hidden />
              {t("pay")}
            </SubmitButton>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-mute">
              <Lock className="size-3" aria-hidden />
              {t("secure")}
            </p>
            {plan ? (
              <p className="text-center text-xs">
                <Link href="/checkout" className="link-underline text-mute hover:text-ink">
                  {t("switchToCart")}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </form>
  );
}

export function CheckoutLoginWall({ plan, next }: { plan: PublicPlan | null; next: string }) {
  const t = useTranslations("checkout");
  const nav = useTranslations("auth");
  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className={cn("rounded-[1.5rem] border border-line bg-white/40 p-8 sm:p-12")}>
          <Lock className="size-6 text-saffron" aria-hidden />
          <p className="mt-6 font-serif text-3xl leading-snug">{t("loginWall")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={`/login?next=${encodeURIComponent(next)}`} size="lg">
              {t("loginCta")}
            </ButtonLink>
            <ButtonLink href={`/signup?next=${encodeURIComponent(next)}`} variant="outline" size="lg">
              {nav("create")}
            </ButtonLink>
          </div>
        </div>
      </div>
      <aside className="lg:col-span-5">
        <div className="card-lux p-6 sm:p-8">
          <h2 className="text-2xl">{t("summaryTitle")}</h2>
          <div className="mt-6">
            <OrderSummary plan={plan} />
          </div>
        </div>
      </aside>
    </div>
  );
}
