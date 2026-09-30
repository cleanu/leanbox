"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { MealCard } from "@/components/menu/meal-card";
import type { PublicMeal } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export function FeaturedMeals({ meals }: { meals: PublicMeal[] }) {
  const t = useTranslations("home.featured");
  if (!meals.length) return null;
  return (
    <section className="py-24 sm:py-32">
      <div className="container-lux">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-6 max-w-2xl text-[clamp(2.2rem,4.6vw,4rem)]">{t("title")}</h2>
          </Reveal>
          <Link href="/menu" className="link-underline group inline-flex items-center gap-2 pb-1 text-sm">
            {t("cta")}
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <div className={cn("mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2", meals.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
          {meals.map((meal, i) => (
            <Reveal key={meal.id} delay={i * 0.08}>
              <MealCard meal={meal} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
