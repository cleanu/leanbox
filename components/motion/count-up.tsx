"use client";

import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Renders the real number (server HTML included), and only counts up from 0 when it
 * starts below the fold after hydration. Writes to the text node directly so React
 * state never shows a wrong value.
 */
export function CountUp({ to, duration = 1.6, className }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const node = el?.firstChild;
    if (!el || !node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    node.nodeValue = "0";
    let controls: ReturnType<typeof animate> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        controls = animate(0, to, {
          duration,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: (v) => {
            node.nodeValue = String(Math.round(v));
          },
        });
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      controls?.stop();
      node.nodeValue = String(to);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {to}
    </span>
  );
}
