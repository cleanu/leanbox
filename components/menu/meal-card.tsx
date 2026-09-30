"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/components/cart/cart-provider";
import { QtyStepper } from "@/components/cart/qty-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { PublicMeal } from "@/lib/catalog/types";
import { pick } from "@/lib/i18n-shared";
import { formatHKD } from "@/lib/money";
import { tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { MacroBar, MacroRow } from "./macros";
import { MealImage } from "./meal-image";

export function MealCard({
  meal,
  onOpen,
  priority,
  className,
}: {
  meal: PublicMeal;
  onOpen?: () => void;
  priority?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const cart = useCart();
  const { toast } = useToast();
  const name = pick(meal, "name", locale);
  const altName = locale === "en" ? meal.name_zh : meal.name_en;
  const qty = cart.quantityOf(meal.id);
  const max = cart.maxFor(meal);
  const soldOut = max <= 0;
  const lowStock = !soldOut && meal.weekly_stock <= 10;

  const media = (
    <>
      <MealImage
        path={meal.image_path}
        alt={name}
        priority={priority}
        className={cn("transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-[1.045]", soldOut && "grayscale-[60%]")}
      />
      <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
        {meal.tags.map((tag) => (
          <Badge key={tag} tone="default" className="border-transparent bg-parchment/90 backdrop-blur">
            {tagLabel(tag, locale)}
          </Badge>
        ))}
      </div>
      {soldOut ? (
        <div className="absolute inset-x-4 bottom-4">
          <Badge tone="ink" className="px-3 py-1 text-xs">{t("soldOut")}</Badge>
        </div>
      ) : lowStock ? (
        <div className="absolute inset-x-4 bottom-4">
          <Badge tone="saffron" className="px-3 py-1 text-xs">{t("lowStock", { count: meal.weekly_stock })}</Badge>
        </div>
      ) : null}
    </>
  );

  const mediaClass = "relative block aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] bg-parchment-3 text-left";

  return (
    <article className={cn("group flex flex-col", className)}>
      {onOpen ? (
        <button type="button" onClick={onOpen} className={mediaClass} aria-label={`${t("viewDetails")}: ${name}`}>
          {media}
        </button>
      ) : (
        <Link href={`/menu?meal=${meal.slug}`} className={mediaClass} aria-label={`${t("viewDetails")}: ${name}`}>
          {media}
        </Link>
      )}

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[1.3rem] leading-snug">{name}</h3>
          <p className="mt-0.5 truncate text-xs italic text-mute" lang={locale === "en" ? "zh-HK" : "en"}>
            {altName}
          </p>
        </div>
        <p className="numeral shrink-0 text-lg">{formatHKD(meal.price_cents)}</p>
      </div>

      <MacroBar meal={meal} className="mt-4" />
      <MacroRow meal={meal} className="mt-2.5" />

      <div className="mt-5 flex items-center gap-3">
        {soldOut ? (
          <Button variant="outline" size="sm" disabled className="opacity-60">
            {t("soldOut")}
          </Button>
        ) : qty > 0 ? (
          <QtyStepper size="sm" value={qty} max={max} onChange={(q) => cart.setQuantity(meal.id, q)} label={name} />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              cart.add(meal.id);
              toast(`${t("added")}：${name}`);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            {t("addToBox")}
          </Button>
        )}
      </div>
    </article>
  );
}
