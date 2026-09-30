"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, splitForReveal } from "@/components/motion/reveal";

export function BrandStatement({ image }: { image: { src: string; alt: string } | null }) {
  const t = useTranslations("home.brand");
  const root = useRef<HTMLElement>(null);
  const statement = t("statement");
  const highlight = t("highlight");
  const hlStart = statement.indexOf(highlight);
  const hlEnd = hlStart + highlight.length;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        "[data-fill]",
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: "[data-statement]", start: "top 80%", end: "bottom 45%", scrub: 0.8 },
        },
      );
    },
    { scope: root },
  );

  const units = splitForReveal(statement).reduce<{ u: string; start: number; highlighted: boolean }[]>((acc, u) => {
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].u.length : 0;
    acc.push({ u, start, highlighted: hlStart >= 0 && start >= hlStart && start < hlEnd });
    return acc;
  }, []);

  return (
    <section ref={root} data-hero-overlap className="relative z-10 bg-cream py-28 sm:py-36">
      <div className="container-lux grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="eyebrow">{t("label")}</p>
          </Reveal>
          <h2 data-statement className="display mt-8 text-[clamp(2.6rem,7vw,6rem)]" aria-label={statement}>
            {units.map(({ u, highlighted }, i) =>
              /^\s+$/.test(u) ? (
                <span key={i}> </span>
              ) : (
                <span key={i} data-fill aria-hidden className={highlighted ? "text-sage-deep" : undefined}>
                  {u}
                </span>
              ),
            )}
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink/75">{t("body")}</p>
          </Reveal>
        </div>

        {image ? (
          <div className="lg:col-span-5">
            <Parallax className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-cream-deep shadow-[0_30px_60px_-20px_rgba(58,58,56,0.25)]" amount={12}>
              <div className="absolute inset-0">
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              </div>
            </Parallax>
          </div>
        ) : null}
      </div>
    </section>
  );
}
