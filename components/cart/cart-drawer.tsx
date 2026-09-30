"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { MealImage } from "@/components/menu/meal-image";
import { MacroRow } from "@/components/menu/macros";
import { deliveryFeeCents, shopConfig } from "@/lib/config";
import { pick } from "@/lib/i18n-shared";
import { formatHKD } from "@/lib/money";
import { useCart } from "./cart-provider";
import { QtyStepper } from "./qty-stepper";

export function CartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();
  const cart = useCart();
  const threshold = shopConfig.delivery.freeThresholdCents;
  const remaining = Math.max(0, threshold - cart.subtotalCents);
  const progress = Math.min(100, (cart.subtotalCents / threshold) * 100);
  const delivery = deliveryFeeCents(cart.subtotalCents);

  return (
    <Sheet
      open={cart.isOpen}
      onClose={cart.close}
      title={t("title")}
      eyebrow={cart.count ? t("items", { count: cart.count }) : undefined}
      closeLabel={tc("close")}
      footer={
        cart.lines.length ? (
          <div className="space-y-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-mute">{tc("subtotal")}</dt>
                <dd className="numeral">{formatHKD(cart.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mute">{tc("delivery")}</dt>
                <dd className="numeral">{delivery ? formatHKD(delivery) : tc("free")}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt>{tc("total")}</dt>
                <dd className="numeral text-lg">{formatHKD(cart.subtotalCents + delivery)}</dd>
              </div>
            </dl>
            <ButtonLink href="/checkout" onClick={cart.close} size="lg" className="w-full">
              {t("checkout")}
              <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" aria-hidden />
            </ButtonLink>
          </div>
        ) : null
      }
    >
      {cart.lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 py-16 text-center">
          <p className="font-serif text-2xl text-walnut">{t("empty")}</p>
          <ButtonLink href="/menu" variant="outline" onClick={cart.close}>
            {t("emptyCta")}
          </ButtonLink>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-parchment-2 p-4">
            <p className="mb-2 text-sm text-walnut">
              {remaining > 0 ? t("freeDeliveryHint", { amount: formatHKD(remaining) }) : t("freeDeliveryReached")}
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-parchment-3">
              <div className="h-full rounded-full bg-olive transition-[width] duration-700 ease-[var(--ease-lux)]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="divide-y divide-line">
            {cart.lines.map((line) => {
              const name = pick(line.meal, "name", locale);
              return (
                <li key={line.mealId} className="flex gap-4 py-5 first:pt-0">
                  <Link
                    href={`/menu?meal=${line.meal.slug}`}
                    onClick={cart.close}
                    className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-parchment-3"
                  >
                    <MealImage path={line.meal.image_path} alt={name} sizes="96px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-serif text-[1.05rem] leading-snug">{name}</p>
                      <p className="numeral shrink-0 text-[0.95rem]">{formatHKD(line.lineTotalCents)}</p>
                    </div>
                    <MacroRow meal={line.meal} className="mt-1" />
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyStepper
                        size="sm"
                        value={line.quantity}
                        max={cart.maxFor(line.meal)}
                        min={1}
                        onChange={(q) => cart.setQuantity(line.mealId, q)}
                        label={name}
                      />
                      <button
                        type="button"
                        onClick={() => cart.remove(line.mealId)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-mute transition hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
