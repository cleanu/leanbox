import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { BrandStatement } from "@/components/home/brand-statement";
import { CtaBand } from "@/components/home/cta-band";
import { Faq } from "@/components/home/faq";
import { FeaturedMeals } from "@/components/home/featured-meals";
import { Founder } from "@/components/home/founder";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { LaunchCountdown } from "@/components/home/launch-countdown";
import { Numbers } from "@/components/home/numbers";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { PlanCard } from "@/components/plans/plan-card";
import { mealImageUrl } from "@/lib/catalog/images";
import { catalogStats, getActiveMeals, getActivePlans } from "@/lib/catalog/queries";
import { listOf, pick } from "@/lib/i18n-shared";

export default async function HomePage() {
  const [{ meals }, { plans }, t, messages] = await Promise.all([
    getActiveMeals(),
    getActivePlans(),
    getTranslations("home"),
    getMessages(),
  ]);
  const stats = catalogStats(meals);
  const inStock = meals.filter((m) => m.weekly_stock > 0);
  const featured = (inStock.length >= 4 ? inStock : meals).slice(0, 4);
  const statementMeal = featured[1] ?? featured[0] ?? null;
  const locale = await getLocale();

  return (
    <>
      <Hero avgProtein={stats.avgProtein} feature={featured[0] ?? null} />
      <BrandStatement image={statementMeal ? { src: mealImageUrl(statementMeal.image_path), alt: pick(statementMeal, "name", locale) } : null} />

      <div className="bg-sage py-7 text-cream">
        <Marquee items={listOf(messages.home.marquee)} className="overflow-hidden" />
      </div>

      <HowItWorks />
      <FeaturedMeals meals={featured} />
      <Numbers avgProtein={stats.avgProtein} avgKcal={stats.avgKcal} count={stats.count} />
      <LaunchCountdown />

      {plans.length ? (
        <section className="py-24 sm:py-32">
          <div className="container-lux">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <Reveal>
                <p className="eyebrow">{t("plans.eyebrow")}</p>
                <h2 className="mt-6 max-w-3xl text-[clamp(2.2rem,4.6vw,4rem)]">{t("plans.title")}</h2>
                <p className="mt-5 max-w-xl text-walnut/80">{t("plans.lede")}</p>
              </Reveal>
              <Link href="/plans" className="link-underline group inline-flex items-center gap-2 pb-1 text-sm">
                {t("plans.cta")}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <Reveal key={plan.id} delay={i * 0.1}>
                  <PlanCard plan={plan} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Founder />
      <Faq />
      <CtaBand />
    </>
  );
}
