"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/actions/locale";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "en" ? "zh-HK" : "en";
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      disabled={pending}
      lang={next}
      aria-label={`${t("language")}: ${t("switchTo")}`}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-xs font-medium tracking-wide transition disabled:opacity-60",
        tone === "ink" ? "border-line-strong hover:border-ink" : "border-line-dark text-parchment hover:border-parchment",
        className,
      )}
    >
      {t("switchTo")}
    </button>
  );
}
