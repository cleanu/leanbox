import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderTimeline } from "@/components/account/order-timeline";
import { FormAlert } from "@/components/ui/form";
import { requireUser } from "@/lib/auth/session";
import { shopConfig } from "@/lib/config";
import { districtLabel } from "@/lib/districts";
import { formatHKD } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { orderRef } from "@/lib/utils";
import { formatHKT, formatWeekId } from "@/lib/weeks";

export const metadata: Metadata = { robots: { index: false } };

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [t, tc, tk, locale] = await Promise.all([
    getTranslations("orders"),
    getTranslations("common"),
    getTranslations("orders.kind"),
    getLocale(),
  ]);
  const supabase = await createClient();
  // RLS: only the owner's order is visible; unit_cost_cents is not selectable by clients.
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(id, name_snapshot, name_en_snapshot, quantity, unit_price_cents)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const fmt = (iso: string | null) => (iso ? formatHKT(iso, locale) : null);

  return (
    <div>
      <Link href="/account/orders" className="link-underline inline-flex items-center gap-2 text-sm text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("backToOrders")}
      </Link>

      <header className="mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="eyebrow">
            {t("order")} · {tk(order.kind)}
          </p>
          <h1 className="numeral mt-3 text-5xl">{orderRef(order.order_number)}</h1>
          <p className="mt-2 text-sm text-mute">
            {t("placed")} {formatHKT(order.created_at, locale)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="mt-12 grid gap-14 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {order.status === "refunded" || order.refunded_cents > 0 ? (
            <FormAlert tone="info">{t("refunded", { amount: formatHKD(order.refunded_cents) })}</FormAlert>
          ) : null}

          <section>
            <h2 className="eyebrow">{t("items")}</h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-6 py-4">
                  <div>
                    <p className="font-serif text-lg">{locale === "en" ? item.name_en_snapshot || item.name_snapshot : item.name_snapshot}</p>
                    <p className="text-xs text-mute">
                      {formatHKD(item.unit_price_cents)} × {item.quantity}
                    </p>
                  </div>
                  <p className="numeral">{formatHKD(item.unit_price_cents * item.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow">{t("deliveryTo")}</h2>
              <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed">
                <p className="font-medium">{order.delivery_name}</p>
                <p>{order.delivery_phone}</p>
                <p>{districtLabel(order.delivery_district, locale)}</p>
                <p>{order.delivery_address}</p>
                {order.delivery_notes ? <p className="text-mute">「{order.delivery_notes}」</p> : null}
              </address>
            </div>
            <div>
              <h2 className="eyebrow">{t("week")}</h2>
              <p className="mt-4 font-serif text-2xl">{formatWeekId(order.fulfillment_week, locale)}</p>
              <p className="text-xs text-mute">{order.fulfillment_week}</p>
            </div>
          </section>

          <section className="rounded-2xl bg-parchment-2 p-6">
            <h2 className="eyebrow">{t("summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-mute">{tc("subtotal")}</dt>
                <dd className="numeral">{formatHKD(order.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mute">{tc("delivery")}</dt>
                <dd className="numeral">{order.delivery_cents ? formatHKD(order.delivery_cents) : tc("free")}</dd>
              </div>
              {order.discount_cents ? (
                <div className="flex justify-between">
                  <dt className="text-mute">{tc("discount")}</dt>
                  <dd className="numeral">−{formatHKD(order.discount_cents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt>{tc("total")}</dt>
                <dd className="numeral text-xl">{formatHKD(order.total_cents)}</dd>
              </div>
            </dl>
            {order.paid_at ? <p className="mt-4 text-xs text-mute">{t("receiptNote")}</p> : null}
            {/* TODO(email): send a branded order confirmation via an ESP (Resend/Postmark). Stripe receipts cover v1. */}
          </section>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="card-lux p-6 sm:p-8">
            <h2 className="eyebrow">{t("timeline")}</h2>
            <div className="mt-6">
              {order.status === "cancelled" || order.status === "refunded" ? (
                <OrderStatusBadge status={order.status} />
              ) : (
                <OrderTimeline
                  status={order.status}
                  stamps={{
                    pending_payment: fmt(order.created_at),
                    paid: fmt(order.paid_at),
                    delivered: fmt(order.delivered_at),
                  }}
                />
              )}
            </div>
            <a
              href={shopConfig.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="link-underline mt-8 inline-flex items-center gap-2 text-sm"
            >
              <MessageCircle className="size-4" aria-hidden /> {t("help")}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
