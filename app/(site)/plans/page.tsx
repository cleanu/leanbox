import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal, SplitReveal } from "@/components/motion/reveal";
import { PlanCard } from "@/components/plans/plan-card";
import { ButtonLink } from "@/components/ui/button";
import { getActivePlans } from "@/lib/catalog/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("plansPage");
  return { title: t("eyebrow"), description: t("lede") };
}

export default async function PlansPage() {
  const [{ plans }, t] = await Promise.all([getActivePlans(), getTranslations("plansPage")]);
  return (
    <div className="container-lux pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+5rem)]">
      <header className="mx-auto max-w-3xl pb-16 text-center">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="display mt-6 text-[clamp(2.6rem,6vw,5.6rem)]">
          <SplitReveal text={t("title")} />
        </h1>
        <Reveal delay={0.3} trigger="mount">
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-walnut/80">{t("lede")}</p>
        </Reveal>
      </header>

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <Reveal key={plan.id} delay={0.1 + i * 0.1} className="h-full">
            <PlanCard plan={plan} index={i} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[1.5rem] border border-line bg-parchment-2 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="font-serif text-2xl">{t("alaCarte")}</p>
            <p className="mt-1 text-sm text-mute">{t("alaCarteBody")}</p>
          </div>
          <ButtonLink href="/menu" variant="outline">
            {t("alaCarteCta")}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </Reveal>
    </div>
  );
}
