import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { cutoffLabel } from "@/lib/weeks";

export function CtaBand() {
  const t = useTranslations("home.cta");
  const f = useTranslations("footer");
  const locale = useLocale();
  return (
    <section className="container-lux">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-sage-deep px-8 py-20 text-cream sm:px-16 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-parchment/15" />
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-64 rounded-full border border-parchment/15" />
        <p className="eyebrow !text-parchment/70">{f("cutoff", { time: cutoffLabel(locale) })}</p>
        <h2 className="display mt-6 max-w-3xl text-[clamp(2.4rem,5.5vw,5rem)]">{t("title")}</h2>
        <p className="mt-6 max-w-lg text-parchment/80">{t("body")}</p>
        <div className="mt-10">
          <Magnetic>
            <ButtonLink href="/plans" variant="light" size="lg">
              {t("button")}
              <ArrowRight className="size-4 transition-transform duration-500 group-hover/btn:translate-x-1" aria-hidden />
            </ButtonLink>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
