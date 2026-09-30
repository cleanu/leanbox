"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";

/** Scroll-scrubbed vertical drift for images (GSAP ScrollTrigger). */
export function Parallax({ children, amount = 12, className }: { children: React.ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const inner = ref.current?.firstElementChild;
        if (!inner) return;
        gsap.fromTo(
          inner,
          { yPercent: -amount / 2, scale: 1.08 },
          {
            yPercent: amount / 2,
            scale: 1.08,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  void ScrollTrigger;
  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      {children}
    </div>
  );
}
