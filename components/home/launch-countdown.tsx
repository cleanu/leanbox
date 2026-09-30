"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Reveal, SplitReveal } from "@/components/motion/reveal";

// 2026-10-26 00:00 in Hong Kong (UTC+8, no DST).
const LAUNCH_AT = Date.UTC(2026, 9, 25, 16, 0, 0);

function remaining(now: number) {
  const ms = Math.max(0, LAUNCH_AT - now);
  const s = Math.floor(ms / 1000);
  return { ms, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function LaunchCountdown() {
  const t = useTranslations("home.launch");
  // Null until mounted so server and client markup match.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const left = now === null ? null : remaining(now);
  if (left && left.ms === 0) return null;

  const tiles = [
    { label: t("days"), value: left?.days },
    { label: t("hours"), value: left?.hours },
    { label: t("minutes"), value: left?.minutes },
    { label: t("seconds"), value: left?.seconds },
  ];

  return (
    <section className="bg-cream-deep py-24 sm:py-32">
      <div className="container-lux flex flex-col items-start gap-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Reveal>
            <p className="eyebrow">{t("label")}</p>
          </Reveal>
          <h2 className="mt-6 text-[clamp(2.2rem,6vw,4.5rem)] font-black">
            <SplitReveal text={t("title1")} trigger="view" className="block whitespace-nowrap" />
            <SplitReveal text={t("title2")} trigger="view" delay={0.25} className="block whitespace-nowrap text-sage-deep" />
          </h2>
        </div>
        <Reveal delay={0.15}>
          <dl className="grid grid-cols-4 gap-2 sm:gap-3" aria-live="off">
            {tiles.map((tile) => (
              <div key={tile.label} className="min-w-[4.5rem] rounded-2xl border border-wood/60 bg-night px-3 py-4 text-center text-cream sm:min-w-24 sm:px-4 sm:py-5">
                <dd className="numeral text-3xl font-black sm:text-5xl">{tile.value === undefined ? "--" : String(tile.value).padStart(2, "0")}</dd>
                <dt className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-wood">{tile.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
