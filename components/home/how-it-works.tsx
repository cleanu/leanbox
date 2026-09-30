"use client";

import { useMessages, useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { Reveal } from "@/components/motion/reveal";
import { listOf } from "@/lib/i18n-shared";

export function HowItWorks() {
  const t = useTranslations("home.how");
  const steps = listOf(useMessages().home.how.steps);
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        // Progress rail fills as you scroll through the steps.
        gsap.fromTo(
          "[data-rail]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-steps]", start: "top 60%", end: "bottom 60%", scrub: true },
          },
        );
        // Each step brightens as it reaches the reading line.
        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0.22 },
            {
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 75%", end: "top 45%", scrub: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="how" ref={root} className="scroll-mt-24 py-28 sm:py-36">
      <div className="container-lux grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <p className="eyebrow">{t("eyebrow")}</p>
              <h2 className="mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">{t("title")}</h2>
            </Reveal>
          </div>
        </div>
        <div className="relative lg:col-span-6 lg:col-start-7" data-steps>
          <div aria-hidden className="absolute left-0 top-0 hidden h-full w-px bg-line lg:block">
            <div data-rail className="h-full w-px origin-top bg-saffron" />
          </div>
          <ol className="space-y-20 lg:space-y-32 lg:pl-14">
            {steps.map((s, i) => (
              <li key={s.title} data-step>
                <Reveal>
                  <span className="numeral text-6xl text-saffron sm:text-7xl">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-5 text-3xl sm:text-4xl">{s.title}</h3>
                  <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-walnut/80">{s.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
