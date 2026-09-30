import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { openBillingPortalAction } from "@/actions/account";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { requireUser } from "@/lib/auth/session";
import { pick } from "@/lib/i18n-shared";
import { formatHKD } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { formatHKT } from "@/lib/weeks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("myPlan");
  return { title: t("eyebrow"), robots: { index: false } };
}

export default async function MyPlanPage({ searchParams }: PageProps<"/account/plan">) {
  await requireUser("/account/plan");
  const [t, tp, locale, sp] = await Promise.all([getTranslations("myPlan"), getTranslations("plansPage"), getLocale(), searchParams]);
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, cancel_at_period_end, plan_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  const planIds = [...new Set((subs ?? []).map((s) => s.plan_id).filter((x): x is string => Boolean(x)))];
  const { data: plans } = planIds.length
    ? await supabase.from("plans").select("id, name_zh, name_en, meals_per_week, price_cents").in("id", planIds)
    : { data: [] };
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));
  const current = (subs ?? []).find((s) => ["active", "trialing", "past_due", "unpaid", "paused"].includes(s.status)) ?? null;
  const statusLabel = (s: string) => (t.has(`statusMap.${s}` as "statusMap.active") ? t(`statusMap.${s}` as "statusMap.active") : s);

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <h1 className="text-[clamp(2.2rem,4.5vw,3.6rem)]">{t("title")}</h1>
        {sp.portal === "unavailable" ? (
          <div className="mt-6">
            <FormAlert tone="info">Stripe Customer Portal 尚未設定（Stripe → Settings → Billing → Customer portal）。</FormAlert>
          </div>
        ) : null}

        {current ? (
          <section className="mt-10 rounded-[1.5rem] bg-ink p-8 text-parchment sm:p-10">
            {(() => {
              const plan = current.plan_id ? planById.get(current.plan_id) : null;
              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="font-serif text-3xl">{plan ? pick(plan, "name", locale) : "—"}</p>
                    <Badge tone={current.status === "active" ? "olive" : "saffron"}>{statusLabel(current.status)}</Badge>
                  </div>
                  {plan ? (
                    <p className="mt-2 text-sm text-mute-on-dark">
                      {tp("mealsPerWeek", { count: plan.meals_per_week })} · {formatHKD(plan.price_cents)}
                      {tp("perWeek")}
                    </p>
                  ) : null}
                  <dl className="mt-8 grid gap-6 border-t border-line-dark pt-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-mute-on-dark">{t("renews")}</dt>
                      <dd className="mt-1 font-serif text-xl">
                        {current.cancel_at_period_end
                          ? t("cancelsOn", { date: formatHKT(current.current_period_end, locale, { dateStyle: "long" }) })
                          : formatHKT(current.current_period_end, locale, { dateStyle: "long" })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-mute-on-dark">{t("status")}</dt>
                      <dd className="mt-1 font-serif text-xl">{statusLabel(current.status)}</dd>
                    </div>
                  </dl>
                </>
              );
            })()}
          </section>
        ) : (
          <section className="mt-10 rounded-[1.5rem] border border-dashed border-line-strong p-10 text-center">
            <p className="font-serif text-2xl">{t("none")}</p>
            <ButtonLink href="/plans" className="mt-8">
              {t("noneCta")}
            </ButtonLink>
          </section>
        )}
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="card-lux p-6 sm:p-8">
          <CreditCard className="size-6 text-saffron" aria-hidden />
          <p className="mt-4 font-serif text-xl">{t("manage")}</p>
          <p className="mt-2 text-sm leading-relaxed text-mute">{t("manageHint")}</p>
          <form action={openBillingPortalAction} className="mt-6">
            <SubmitButton size="md" variant="outline" className="w-full">
              {t("manage")}
            </SubmitButton>
          </form>
          <ButtonLink href="/menu" variant="ghost" size="sm" className="mt-3 w-full">
            {t("browse")}
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
