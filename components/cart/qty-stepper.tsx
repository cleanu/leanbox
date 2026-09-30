"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max,
  size = "md",
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const t = useTranslations("cart");
  const btn = cn(
    "grid place-items-center rounded-full transition hover:bg-parchment-3 disabled:opacity-30 disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line-strong bg-white/50",
        size === "sm" ? "h-9 px-0.5" : "h-11 px-0.5",
      )}
      role="group"
      aria-label={label}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t("decrease")}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className={cn("numeral min-w-8 text-center tabular-nums", size === "sm" ? "text-sm" : "text-base")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t("increase")}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
