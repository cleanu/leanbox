import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { Reveal, SplitReveal } from "@/components/motion/reveal";
import { getActiveMeals } from "@/lib/catalog/queries";
import { cutoffLabel } from "@/lib/weeks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("menu");
  return { title: t("eyebrow"), description: t("lede") };
}

export default async function MenuPage() {
  const [{ meals }, t, locale] = await Promise.all([getActiveMeals(), getTranslations("menu"), getLocale()]);
  return (
    <div className="container-lux pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+5rem)]">
      <header className="grid gap-8 pb-14 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="display mt-6 text-[clamp(2.6rem,6vw,5.6rem)]">
            <SplitReveal text={t("title")} stagger={0.025} />
          </h1>
        </div>
        <Reveal className="lg:col-span-4" delay={0.3} trigger="mount">
          <p className="leading-relaxed text-walnut/80">{t("lede")}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs tracking-wide text-mute">
            <span className="size-1.5 rounded-full bg-saffron" />
            {t("cutoff", { time: cutoffLabel(locale) })}
          </p>
        </Reveal>
      </header>
      <Suspense>
        <MenuBrowser meals={meals} />
      </Suspense>
    </div>
  );
}
