"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/components/cart/cart-provider";
import { MealImage } from "@/components/menu/meal-image";
import type { PublicPlan } from "@/lib/catalog/types";
import { deliveryFeeCents } from "@/lib/config";
import { kolDiscountCents, type KolDiscount } from "@/lib/kol";
import { pick } from "@/lib/i18n-shared";
import { formatHKD } from "@/lib/money";

export function useCheckoutTotals(plan: PublicPlan | null) {
  const cart = useCart();
  const subtotal = plan ? plan.price_cents : cart.subtotalCents;
  const delivery = plan ? 0 : deliveryFeeCents(subtotal);
  return { subtotal, delivery, total: subtotal + delivery };
}

export function OrderSummary({ plan, kol = null }: { plan: PublicPlan | null; kol?: KolDiscount | null }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const locale = useLocale();
  const cart = useCart();
  const { subtotal, delivery, total } = useCheckoutTotals(plan);
  const discount = kol ? kolDiscountCents(kol, total) : 0;

  return (
    <div>
      {plan ? (
        <div className="rounded-2xl bg-parchment-2 p-5">
          <p className="font-serif text-xl">{t("planSummary", { name: pick(plan, "name", locale), count: plan.meals_per_week })}</p>
          <p className="mt-2 text-sm leading-relaxed text-mute">{t("planNote")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {cart.lines.map((l) => (
            <li key={l.mealId} className="flex items-center gap-4 py-3.5 first:pt-0">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-parchment-3">
                <MealImage path={l.meal.image_path} alt="" sizes="56px" />
                <span className="numeral absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[0.65rem] text-parchment">
                  {l.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{pick(l.meal, "name", locale)}</p>
                <p className="text-xs text-mute">
                  {l.meal.kcal} {tc("kcal")} · {tc("protein")} {l.meal.protein_g}g
                </p>
              </div>
              <p className="numeral text-sm">{formatHKD(l.lineTotalCents)}</p>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-mute">{tc("subtotal")}</dt>
          <dd className="numeral">{formatHKD(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mute">
            {tc("delivery")}
            {!plan && delivery > 0 ? <span className="ml-2 text-xs">({t("freeDeliveryNote")})</span> : null}
          </dt>
          <dd className="numeral">{delivery ? formatHKD(delivery) : tc("free")}</dd>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-olive-2">
            <dt>
              {tc("discount")}
              <span className="ml-2 font-mono text-xs">{kol?.code}</span>
            </dt>
            <dd className="numeral">−{formatHKD(discount)}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-medium">{tc("total")}</dt>
          <dd className="numeral text-2xl">
            {formatHKD(total - discount)}
            {plan ? <span className="ml-1 text-sm text-mute">{tc("perWeek")}</span> : null}
          </dd>
        </div>
      </dl>
    </div>
  );
}
