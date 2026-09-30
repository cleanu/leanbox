"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import type { PublicMeal } from "@/lib/catalog/types";
import { MEAL_TAGS, tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { MealCard } from "./meal-card";
import { MealSheet } from "./meal-sheet";

type Sort = "recommended" | "protein" | "kcal" | "price";

// Filters and sorting only earn their space once the menu outgrows two rows of cards.
const CONTROLS_MIN_MEALS = 7;

export function MenuBrowser({ meals }: { meals: PublicMeal[] }) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recommended");

  const selectedSlug = params.get("meal");
  const selected = useMemo(() => meals.find((m) => m.slug === selectedSlug) ?? null, [meals, selectedSlug]);

  const openMeal = useCallback(
    (slug: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (slug) next.set("meal", slug);
      else next.delete("meal");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const visible = useMemo(() => {
    const list = tag ? meals.filter((m) => m.tags.includes(tag)) : [...meals];
    const soldOutLast = (a: PublicMeal, b: PublicMeal) => Number(a.weekly_stock <= 0) - Number(b.weekly_stock <= 0);
    switch (sort) {
      case "protein":
        return list.sort((a, b) => soldOutLast(a, b) || b.protein_g - a.protein_g);
      case "kcal":
        return list.sort((a, b) => soldOutLast(a, b) || a.kcal - b.kcal);
      case "price":
        return list.sort((a, b) => soldOutLast(a, b) || a.price_cents - b.price_cents);
      default:
        return list.sort((a, b) => soldOutLast(a, b) || a.sort_order - b.sort_order);
    }
  }, [meals, tag, sort]);

  const chips = [{ value: null, label: t("filterAll") }, ...MEAL_TAGS.map((x) => ({ value: x.value as string, label: tagLabel(x.value, locale) }))];
  const showControls = meals.length >= CONTROLS_MIN_MEALS;

  return (
    <>
      {showControls ? (
        <div className="sticky top-[var(--header-h)] z-30 -mx-[clamp(1.25rem,4vw,3rem)] border-y border-line bg-parchment/90 px-[clamp(1.25rem,4vw,3rem)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Filter">
              {chips.map((c) => {
                const active = tag === c.value;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setTag(c.value)}
                    aria-pressed={active}
                    className={cn(
                      "h-9 shrink-0 rounded-full border px-4 text-sm transition",
                      active ? "border-ink bg-ink text-parchment" : "border-line-strong hover:border-ink",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-mute">{t("results", { count: visible.length })}</span>
              <label className="sr-only" htmlFor="menu-sort">
                {t("sortLabel")}
              </label>
              <select
                id="menu-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="field h-9 w-auto rounded-full py-0 pl-4 text-sm"
              >
                {(["recommended", "protein", "kcal", "price"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`sort.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-line" />
      )}

      {visible.length === 0 ? (
        <div className="py-32 text-center">
          <p className="font-serif text-2xl text-walnut">{t("empty")}</p>
          <button type="button" onClick={() => setTag(null)} className="link-underline mt-6 text-sm">
            {t("clearFilters")}
          </button>
        </div>
      ) : (
        <motion.div layout className="grid gap-x-8 gap-y-16 pt-14 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((meal, i) => (
              <motion.div
                key={meal.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 6) * 0.04 }}
              >
                <MealCard meal={meal} onOpen={() => openMeal(meal.slug)} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <MealSheet meal={selected} onClose={() => openMeal(null)} />
    </>
  );
}
