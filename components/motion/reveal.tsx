"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Trigger = "mount" | "view";

/**
 * Scroll reveal that never hides server-rendered content: elements render visible, and only
 * those still below the fold after hydration are armed (data-<attr>="armed") and revealed
 * when they scroll into view. On-screen elements and reduced-motion users are left as is.
 */
function useScrollReveal<T extends HTMLElement>(attr: "reveal" | "split", enabled: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.dataset[attr] = "armed";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.dataset[attr] = "shown";
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [attr, enabled]);
  return ref;
}

/** Fade + rise: on first paint ("mount", CSS only) or when scrolled into view ("view"). */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  trigger = "view",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  trigger?: Trigger;
}) {
  const ref = useScrollReveal<HTMLDivElement>("reveal", trigger === "view");
  return (
    <div
      ref={ref}
      className={cn(trigger === "mount" && "enter-fade-up", className)}
      style={{ "--delay": `${delay}s`, "--from-y": `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

const NO_LINE_START = /^[，。、！？；：」』）》〉…,.!?;:)]$/;
const NO_LINE_END = /^[「『（《〈(]$/;

/**
 * Split text into animation units: latin per word (keeping the spaces), CJK per character.
 * Each character becomes its own inline-block, which disables the browser's CJK line-breaking
 * rules, so punctuation is glued to its neighbour to keep "，" off the start of a line.
 */
export function splitForReveal(text: string): string[] {
  if (!/[㐀-鿿]/.test(text)) return text.split(/(\s+)/);
  const units: string[] = [];
  let opening = "";
  for (const ch of Array.from(text)) {
    if (NO_LINE_START.test(ch) && units.length) units[units.length - 1] += ch;
    else if (NO_LINE_END.test(ch)) opening += ch;
    else {
      units.push(opening + ch);
      opening = "";
    }
  }
  if (opening) units.push(opening);
  return units;
}

/**
 * Headline that rises in character by character (works for 中文 and latin).
 * "mount" plays on first paint with pure CSS; "view" waits until it scrolls into view.
 */
export function SplitReveal({
  text,
  className,
  delay = 0,
  stagger = 0.035,
  trigger = "mount",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: Trigger;
}) {
  const ref = useScrollReveal<HTMLSpanElement>("split", trigger === "view");
  return (
    <span ref={ref} className={className} style={{ "--delay": `${delay}s`, "--stagger": `${stagger}s` } as React.CSSProperties}>
      <span className="sr-only">{text}</span>
      {splitForReveal(text).map((u, i) =>
        /^\s+$/.test(u) ? (
          <span key={i} aria-hidden>
            {" "}
          </span>
        ) : (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span
              className={cn("split-unit inline-block", trigger === "mount" && "enter-rise")}
              style={
                trigger === "mount"
                  ? ({ "--delay": `${(delay + i * stagger).toFixed(3)}s` } as React.CSSProperties)
                  : ({ "--i": i } as React.CSSProperties)
              }
            >
              {u}
            </span>
          </span>
        ),
      )}
    </span>
  );
}
