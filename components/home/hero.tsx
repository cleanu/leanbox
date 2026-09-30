"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitReveal } from "@/components/motion/reveal";
import { MacroRow } from "@/components/menu/macros";
import { ButtonLink } from "@/components/ui/button";
import { mealImageUrl } from "@/lib/catalog/images";
import type { PublicMeal } from "@/lib/catalog/types";
import { pick } from "@/lib/i18n-shared";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as React.CSSProperties;

export function Hero({ avgProtein, feature }: { avgProtein: number; feature: PublicMeal | null }) {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const root = useRef<HTMLElement>(null);

  const stats = [
    { value: t("stat1"), label: t("stat1Label") },
    { value: t("stat2", { protein: avgProtein }), label: t("stat2Label") },
    { value: t("stat3"), label: t("stat3Label") },
  ];

  // Pinned scroll film (desktop only). For the first viewport of scroll the photo dollies
  // out and the copy lifts away; for the second, the next section ([data-hero-overlap])
  // slides up over the still-pinned scene. The overlap margin is set here, not in CSS,
  // so it only exists while the pin does (no covered hero before hydration or on mobile).
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const next = document.querySelector<HTMLElement>("[data-hero-overlap]");
        // 100vh matches the pin's second viewport ("+=200%"), and stays in sync on resize.
        const overlap = { marginTop: "-100vh", borderTopLeftRadius: "2.5rem", borderTopRightRadius: "2.5rem", boxShadow: "0 -30px 60px -30px rgba(36,36,31,0.45)" };
        if (next) Object.assign(next.style, overlap);
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=200%",
              scrub: 0.8,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .fromTo("[data-hero-media]", { scale: 1.18 }, { scale: 1, ease: "none", duration: 1 }, 0)
          .to("[data-hero-cue]", { autoAlpha: 0, duration: 0.1 }, 0)
          .to("[data-hero-copy]", { yPercent: -14, autoAlpha: 0, ease: "power2.inOut", duration: 0.4 }, 0.05)
          .to("[data-hero-card]", { y: -60, autoAlpha: 0, ease: "power2.inOut", duration: 0.35 }, 0.1)
          .to("[data-hero-media]", { autoAlpha: 0.35, ease: "none", duration: 0.5 }, 0.5)
          // Once covered, hide the scene: the overlapping section can be shorter than the hero,
          // and the released hero would otherwise paint over the content that follows it.
          .set(root.current, { autoAlpha: 0 }, 0.97);
        return () => {
          if (next) for (const key of Object.keys(overlap)) next.style.removeProperty(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const imageSrc = feature ? mealImageUrl(feature.image_path) : "/food/hero.jpg";

  return (
    <section ref={root} className="relative isolate flex min-h-svh overflow-hidden bg-night text-cream">
      <div data-hero-media className="absolute inset-0 -z-10 will-change-transform lg:left-[38%]">
        <Image
          src={imageSrc}
          alt={feature ? pick(feature, "name", locale) : "LeanBox"}
          fill
          priority
          sizes="100vw"
          unoptimized={imageSrc.startsWith("http")}
          className="object-cover object-center opacity-60"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-night/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/60" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 -z-10 size-[40rem] rounded-full bg-sage/20 blur-3xl" />

      <div className="container-lux relative flex w-full flex-col justify-end pb-16 pt-[calc(var(--header-h)+3rem)] lg:pb-20">
        <div data-hero-copy className="max-w-4xl">
          <p className="eyebrow enter-track-in flex items-center gap-3 !text-cream/70" style={delay(0.1)}>
            <span className="h-px w-10 bg-sage" aria-hidden />
            {t("eyebrow")}
          </p>

          <h1 className="display mt-8 text-[clamp(3rem,8.5vw,7.25rem)]">
            <SplitReveal text={t("title1")} className="block" delay={0.2} stagger={0.04} />
            <SplitReveal text={t("title2")} className="block text-sage" delay={0.6} stagger={0.04} />
          </h1>

          <p className="enter-fade-up mt-8 max-w-xl text-[1.05rem] leading-relaxed text-cream/80 sm:text-lg" style={delay(1.1)}>
            {t("lede")}
          </p>

          <div className="enter-fade-up mt-10 flex flex-wrap items-center gap-3" style={delay(1.25)}>
            <Magnetic>
              <ButtonLink href="/plans" size="lg">
                {t("ctaPrimary")}
                <ArrowRight className="size-4 transition-transform duration-500 group-hover/btn:translate-x-1" aria-hidden />
              </ButtonLink>
            </Magnetic>
            <Magnetic strength={0.2}>
              <ButtonLink href="/menu" variant="outline" size="lg" className="border-cream/40 text-cream hover:border-cream hover:bg-cream hover:text-night">
                {t("ctaSecondary")}
              </ButtonLink>
            </Magnetic>
          </div>

          <dl className="enter-fade-in mt-14 grid max-w-xl grid-cols-3 divide-x divide-line-dark border-y border-line-dark" style={delay(1.45)}>
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-5 first:pl-0">
                <dd className="numeral text-2xl font-extrabold sm:text-3xl">{s.value}</dd>
                <dt className="mt-1 text-xs tracking-wide text-cream/60">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {feature ? (
          <div
            data-hero-card
            className="enter-fade-up mt-12 w-full max-w-sm rounded-2xl border border-cream/15 bg-night/55 p-5 backdrop-blur-md lg:absolute lg:bottom-20 lg:right-[clamp(1.25rem,4vw,3rem)] lg:mt-0"
            style={{ ...delay(1.6), "--from-y": "30px" } as React.CSSProperties}
          >
            <p className="eyebrow !text-sage">{t("cardLabel")}</p>
            <p className="mt-2 font-serif text-lg font-bold leading-snug">{pick(feature, "name", locale)}</p>
            <MacroRow meal={feature} tone="light" className="mt-3" />
          </div>
        ) : null}

        <p
          aria-hidden
          data-hero-cue
          className="enter-fade-in absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-cream/50 md:flex"
          style={delay(2)}
        >
          {t("scroll")}
          <ArrowDown className="size-3 animate-bounce" />
        </p>
      </div>
    </section>
  );
}
