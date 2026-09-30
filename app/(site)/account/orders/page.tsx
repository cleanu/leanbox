import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { formatHKD } from "@/lib/money";
import { syncReturnedCheckout } from "@/lib/orders/sync";
import { createClient } from "@/lib/supabase/server";
import { orderRef } from "@/lib/utils";
import { formatHKT, formatWeekId } from "@/lib/weeks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("title"), robots: { index: false } };
}

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const user = await requireUser("/account/orders");
  const sp = await searchParams;
  const [t, tk, tc, ta, locale] = await Promise.all([
    getTranslations("orders"),
    getTranslations("orders.kind"),
    getTranslations("common"),
    getTranslations("account"),
    getLocale(),
  ]);

  // Returning from Stripe: confirm + fulfil immediately (idempotent with the webhook).
  let returned: "paid" | "pending" | "ignored" | null = null;
  if (sp.success === "1" && typeof sp.session_id === "string") {
    returned = await syncReturnedCheckout(sp.session_id, user.id);
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, kind, fulfillment_week, total_cents, created_at, order_items(quantity)")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-[clamp(2.2rem,4.5vw,3.6rem)]">{t("title")}</h1>

      {sp.success === "1" ? (
        <div className={`mt-8 flex items-start gap-4 rounded-2xl p-6 ${returned === "pending" ? "bg-saffron-soft/70" : "bg-olive-soft"}`} role="status">
          {returned === "pending" ? (
            <Clock className="mt-0.5 size-6 shrink-0 text-saffron" aria-hidden />
          ) : (
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-olive" aria-hidden />
          )}
          <div>
            <p className="font-serif text-xl">{t("successTitle")}</p>
            <p className="mt-1 text-sm text-walnut/85">{returned === "pending" ? t("processing") : t("successBody")}</p>
            <p className="mt-1 text-xs text-mute">{t("receiptNote")}</p>
          </div>
        </div>
      ) : null}

      {orders?.length ? (
        <div className="mt-10 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-parchment-2 text-xs uppercase tracking-wider text-mute">
              <tr>
                <th className="px-5 py-3 font-medium">{t("order")}</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">{t("week")}</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">{t("items")}</th>
                <th className="px-5 py-3 font-medium">{t("timeline")}</th>
                <th className="px-5 py-3 text-right font-medium">{tc("total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-white/50">
                  <td className="px-5 py-4">
                    <Link href={`/account/orders/${o.id}`} className="link-underline numeral">
                      {orderRef(o.order_number)}
                    </Link>
                    <p className="mt-0.5 text-xs text-mute">
                      {formatHKT(o.created_at, locale, { dateStyle: "medium" })} · {tk(o.kind)}
                    </p>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">{formatWeekId(o.fulfillment_week, locale)}</td>
                  <td className="hidden px-5 py-4 md:table-cell">{o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-5 py-4">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="numeral px-5 py-4 text-right">{formatHKD(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-line-strong py-20 text-center">
          <p className="font-serif text-2xl">{t("empty")}</p>
          <ButtonLink href="/menu" className="mt-8">
            {ta("nextDeliveryCta")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
