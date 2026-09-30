"use client";

import { Flame, Snowflake, Timer } from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { QtyStepper } from "@/components/cart/qty-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import type { PublicMeal } from "@/lib/catalog/types";
import { listOf, pick } from "@/lib/i18n-shared";
import { formatHKD } from "@/lib/money";
import { tagLabel } from "@/lib/tags";
import { MacroBar } from "./macros";
import { MealImage } from "./meal-image";

export function MealSheet({ meal, onClose }: { meal: PublicMeal | null; onClose: () => void }) {
  const t = useTranslations("menu.detail");
  const tc = useTranslations("common");
  const locale = useLocale();
  const heatingSteps = listOf(useMessages().menu.detail.heatingSteps);
  const cart = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset quantity when a different meal opens
    setQty(1);
  }, [meal?.id]);

  const name = meal ? pick(meal, "name", locale) : "";
  const inCart = meal ? cart.quantityOf(meal.id) : 0;
  const max = meal ? Math.max(0, cart.maxFor(meal) - inCart) : 0;
  const soldOut = meal ? cart.maxFor(meal) <= 0 : true;

  return (
    <Sheet
      open={Boolean(meal)}
      onClose={onClose}
      title={name}
      eyebrow={meal ? (locale === "en" ? meal.name_zh : meal.name_en) : undefined}
      closeLabel={tc("close")}
      footer={
        meal ? (
          <div className="flex items-center gap-3">
            {soldOut ? (
              <Button size="lg" className="w-full" disabled>
                {tc("soldOut")}
              </Button>
            ) : (
              <>
                <QtyStepper value={Math.min(qty, Math.max(max, 1))} min={1} max={Math.max(max, 1)} onChange={setQty} label={t("quantity")} />
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={max <= 0}
                  onClick={() => {
                    cart.add(meal.id, Math.min(qty, max));
                    toast(`${tc("added")}：${name} × ${Math.min(qty, max)}`);
                    onClose();
                  }}
                >
                  {max <= 0 ? tc("soldOut") : `${tc("addToBox")} · ${formatHKD(meal.price_cents * Math.min(qty, Math.max(max, 1)))}`}
                </Button>
              </>
            )}
          </div>
        ) : null
      }
    >
      {meal ? (
        <div className="space-y-9">
          <div className="relative -mx-6 -mt-6 aspect-[16/11] overflow-hidden bg-parchment-3 sm:-mx-8">
            <MealImage path={meal.image_path} alt={name} sizes="544px" priority />
            <div className="absolute left-5 top-5 flex flex-wrap gap-1.5">
              {meal.tags.map((tag) => (
                <Badge key={tag} className="border-transparent bg-parchment/90">
                  {tagLabel(tag, locale)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-6">
            <p className="leading-relaxed text-walnut/85">{pick(meal, "description", locale)}</p>
            <p className="numeral shrink-0 text-2xl">{formatHKD(meal.price_cents)}</p>
          </div>

          <section>
            <h3 className="eyebrow">{t("nutrition")}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                { k: tc("kcal"), v: meal.kcal, u: "" },
                { k: tc("protein"), v: meal.protein_g, u: "g" },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-line bg-olive-soft/60 px-5 py-4">
                  <dd className="numeral text-4xl leading-none">
                    {x.v}
                    <span className="text-base text-mute">{x.u}</span>
                  </dd>
                  <dt className="mt-1.5 text-[0.7rem] tracking-wide text-mute">{x.k}</dt>
                </div>
              ))}
            </dl>
            <dl className="mt-3 flex gap-6 text-sm text-mute">
              {[
                { k: tc("carbs"), v: meal.carbs_g },
                { k: tc("fat"), v: meal.fat_g },
              ].map((x) => (
                <div key={x.k} className="flex items-baseline gap-1.5">
                  <dt>{x.k}</dt>
                  <dd className="numeral text-ink">{x.v}g</dd>
                </div>
              ))}
            </dl>
            <MacroBar meal={meal} className="mt-3" />
          </section>

          <section>
            <h3 className="eyebrow">{t("ingredients")}</h3>
            <dl className="mt-3 divide-y divide-line rounded-2xl border border-line">
              {pick(meal, "ingredients", locale)
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                  const [ingredientName, amount] = line.split(" — ");
                  return (
                    <div key={line} className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm">
                      <dt className="text-walnut/85">{ingredientName}</dt>
                      {amount ? <dd className="numeral shrink-0 text-mute">{amount}</dd> : null}
                    </div>
                  );
                })}
            </dl>
          </section>

          <section>
            <h3 className="eyebrow">{t("allergens")}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meal.allergens.length ? (
                meal.allergens.map((a) => (
                  <Badge key={a} tone="saffron">
                    {a}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-mute">{t("allergensNone")}</span>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mute">{t("allergensNote")}</p>
          </section>

          <section className="rounded-2xl bg-parchment-2 p-5">
            <h3 className="eyebrow flex items-center gap-2">
              <Flame className="size-3.5 text-saffron" aria-hidden />
              {t("heating")}
            </h3>
            <ol className="mt-4 space-y-2.5 text-sm">
              {heatingSteps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="numeral text-saffron">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex items-center gap-4 border-t border-line pt-4 text-xs text-mute">
              <span className="inline-flex items-center gap-1.5">
                <Timer className="size-3.5" aria-hidden /> ~3 min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Snowflake className="size-3.5" aria-hidden /> {t("storage")}
              </span>
            </p>
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}
