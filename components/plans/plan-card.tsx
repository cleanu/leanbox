import { Check } from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { Magnetic } from "@/components/motion/magnetic";
import { ButtonLink } from "@/components/ui/button";
import type { PublicPlan } from "@/lib/catalog/types";
import { listOf, pick } from "@/lib/i18n-shared";
import { formatHKD } from "@/lib/money";
import { cn } from "@/lib/utils";

export function PlanCard({ plan, index }: { plan: PublicPlan; index: number }) {
  const t = useTranslations("plansPage");
  const locale = useLocale();
  const featured = plan.is_featured;
  const perMeal = Math.round(plan.price_cents / plan.meals_per_week / 100) * 100;
  const includes = listOf(useMessages().plansPage.includes);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[1.5rem] border p-8 transition-transform duration-700 ease-[var(--ease-lux)] hover:-translate-y-1 sm:p-10",
        featured ? "border-transparent bg-ink text-parchment shadow-[0_40px_80px_-40px_rgba(22,19,16,0.7)]" : "border-line bg-white/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("numeral text-sm", featured ? "text-saffron-2" : "text-saffron")}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {featured ? (
          <span className="rounded-full bg-saffron px-3 py-1 text-[0.68rem] font-semibold tracking-wider text-ink">{t("featured")}</span>
        ) : null}
      </div>
      <h3 className="mt-8 text-3xl">{pick(plan, "name", locale)}</h3>
      <p className={cn("mt-2 text-sm", featured ? "text-mute-on-dark" : "text-mute")}>{pick(plan, "description", locale)}</p>

      <div className="mt-10 flex items-baseline gap-1">
        <span className="numeral text-5xl tracking-tight">{formatHKD(plan.price_cents)}</span>
        <span className={cn("text-sm", featured ? "text-mute-on-dark" : "text-mute")}>{t("perWeek")}</span>
      </div>
      <p className={cn("mt-1 text-sm", featured ? "text-mute-on-dark" : "text-mute")}>
        {t("mealsPerWeek", { count: plan.meals_per_week })} · {t("perMeal", { amount: formatHKD(perMeal) })}
      </p>

      <ul className={cn("mt-8 space-y-3 border-t pt-8 text-sm", featured ? "border-line-dark" : "border-line")}>
        {includes.map((line) => (
          <li key={line} className="flex items-start gap-3">
            <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-saffron-2" : "text-olive")} aria-hidden />
            {line}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-10">
        <Magnetic className="block">
          <ButtonLink href={`/checkout?plan=${plan.id}`} variant={featured ? "saffron" : "primary"} size="lg" className="w-full">
            {t("choose")}
          </ButtonLink>
        </Magnetic>
      </div>
    </article>
  );
}
