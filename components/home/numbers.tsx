"use client";

import { useMessages, useTranslations } from "next-intl";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { listOf } from "@/lib/i18n-shared";

export function Numbers({ avgProtein, avgKcal, count }: { avgProtein: number; avgKcal: number; count: number }) {
  const t = useTranslations("home.numbers");
  const items = listOf(useMessages().home.numbers.items);
  const resolve = (v: string) =>
    Number(v.replace("{protein}", String(avgProtein)).replace("{kcal}", String(avgKcal)).replace("{count}", String(count)));

  return (
    <section className="relative overflow-hidden bg-walnut py-28 text-parchment sm:py-36">
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 size-[36rem] rounded-full bg-olive/30 blur-3xl" />
      <div className="container-lux relative grid gap-16 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow !text-mute-on-dark">{t("eyebrow")}</p>
          <h2 className="mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">{t("title")}</h2>
          <p className="mt-6 max-w-md leading-relaxed text-mute-on-dark">{t("lede")}</p>
        </Reveal>
        <dl className="grid grid-cols-2 gap-px self-end overflow-hidden rounded-3xl bg-line-dark lg:col-span-6 lg:col-start-7">
          {items.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.08} className="bg-walnut p-8 sm:p-10">
              <dd className="flex items-baseline gap-1.5">
                <CountUp to={resolve(item.value)} className="numeral text-6xl tracking-tight sm:text-7xl" />
                {item.unit ? <span className="numeral text-lg text-saffron-2">{item.unit}</span> : null}
              </dd>
              <dt className="mt-3 text-sm text-mute-on-dark">{item.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
