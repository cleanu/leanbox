import { ArrowLeft, ExternalLink, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm, QuickStatus, RefundForm } from "@/components/admin/order-actions";
import { StatusSelect } from "@/components/admin/status-select";
import { AdminStatusBadge, Panel, Table, Td, Th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { estimateStripeFeeCents } from "@/lib/config";
import { districtLabel } from "@/lib/districts";
import { isStripeConfigured, serverEnv } from "@/lib/env.server";
import { formatHKD } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { maskId, orderRef } from "@/lib/utils";
import { formatHKT, formatWeekId } from "@/lib/weeks";

export const metadata = { title: "訂單詳情" };

function StripeLink({ id, kind }: { id: string | null; kind: "payments" | "subscriptions" | "checkout/sessions" }) {
  if (!id) return <span className="text-mute">—</span>;
  const mode = serverEnv.stripeSecretKey.startsWith("sk_live") ? "" : "test/";
  const href = kind === "checkout/sessions" ? null : `https://dashboard.stripe.com/${mode}${kind}/${id}`;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="numeral inline-flex items-center gap-1 font-mono text-xs hover:underline">
      {maskId(id)} <ExternalLink className="size-3" aria-hidden />
    </a>
  ) : (
    <span className="font-mono text-xs">{maskId(id)}</span>
  );
}

export default async function AdminOrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const [{ data: notes }, { data: auditRows }, { data: profile }] = await Promise.all([
    admin.from("order_notes").select("*").eq("order_id", id).order("created_at", { ascending: true }),
    admin.from("admin_audit").select("*").eq("entity", "orders").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
    order.user_id ? admin.from("profiles").select("email, contact_email, full_name, phone").eq("id", order.user_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const items = order.order_items;
  const sales = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
  const cogs = items.reduce((s, i) => s + i.unit_cost_cents * i.quantity, 0);
  const fee = order.paid_at ? estimateStripeFeeCents(order.total_cents) : 0;
  const gross = sales - cogs - order.refunded_cents;
  const waNumber = order.delivery_phone.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> 返回訂單
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-mute">{order.kind === "subscription" ? "每週計劃" : "單點"} · 建立於 {formatHKT(order.created_at, "zh-HK")}</p>
          <h1 className="numeral mt-1 text-4xl">{orderRef(order.order_number)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <AdminStatusBadge status={order.status} />
          <StatusSelect orderId={order.id} status={order.status} />
        </div>
      </header>

      {order.payment_error ? <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">付款錯誤：{order.payment_error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="餐點與利潤">
            <div className="-m-5">
              <Table className="rounded-none border-0">
                <thead>
                  <tr>
                    <Th>項目</Th>
                    <Th className="text-right">數量</Th>
                    <Th className="text-right">單價</Th>
                    <Th className="text-right">單位成本</Th>
                    <Th className="text-right">毛利</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <Td>
                        {i.name_snapshot}
                        {i.name_en_snapshot ? <span className="block text-[0.7rem] text-mute">{i.name_en_snapshot}</span> : null}
                      </Td>
                      <Td className="numeral text-right">{i.quantity}</Td>
                      <Td className="numeral text-right">{formatHKD(i.unit_price_cents)}</Td>
                      <Td className="numeral text-right text-mute">{formatHKD(i.unit_cost_cents)}</Td>
                      <Td className="numeral text-right">{formatHKD((i.unit_price_cents - i.unit_cost_cents) * i.quantity)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <dl className="mt-10 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["餐點銷售", formatHKD(sales)],
                ["成本 (COGS)", formatHKD(cogs)],
                ["運費", formatHKD(order.delivery_cents)],
                ["折扣", formatHKD(order.discount_cents)],
                ["總額", formatHKD(order.total_cents)],
                ["退款", formatHKD(order.refunded_cents)],
                ["估算 Stripe 手續費", formatHKD(fee)],
                ["毛利（扣退款）", formatHKD(gross)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line py-1.5">
                  <dt className="text-mute">{k}</dt>
                  <dd className="numeral">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between py-1.5 sm:col-span-2">
                <dt className="font-medium">淨利（估算）</dt>
                <dd className="numeral text-lg">{order.paid_at ? formatHKD(gross - fee) : "—"}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="內部備註">
            <ul className="mb-4 space-y-3">
              {(notes ?? []).map((n) => (
                <li key={n.id} className="rounded-xl bg-parchment-2 px-4 py-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-[0.7rem] text-mute">{formatHKT(n.created_at, "zh-HK")}</p>
                </li>
              ))}
              {!notes?.length ? <li className="text-sm text-mute">暫無備註</li> : null}
            </ul>
            <NoteForm orderId={order.id} />
          </Panel>

          <Panel title="操作紀錄">
            <ul className="space-y-2 text-xs">
              {(auditRows ?? []).map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                  <span className="font-mono">{a.action}</span>
                  <span className="text-mute">{JSON.stringify(a.meta)}</span>
                  <span className="text-mute">{formatHKT(a.created_at, "zh-HK")}</span>
                </li>
              ))}
              {!auditRows?.length ? <li className="text-mute">暫無紀錄</li> : null}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="客戶及送遞">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.delivery_name}</p>
              <p>{order.customer_email ?? profile?.contact_email ?? profile?.email ?? "—"}</p>
              <p>{order.delivery_phone}</p>
              <p className="pt-2">{districtLabel(order.delivery_district, "zh-HK")}</p>
              <p>{order.delivery_address}</p>
              {order.delivery_notes ? <p className="text-mute">備註：{order.delivery_notes}</p> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <a href={`tel:${waNumber}`} className="inline-flex items-center gap-1.5 hover:underline">
                <Phone className="size-3.5" aria-hidden /> 致電
              </a>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
              </a>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs text-mute">送遞週次</p>
              <p className="font-serif text-lg">{formatWeekId(order.fulfillment_week, "zh-HK")}</p>
              <p className="text-xs text-mute">{order.fulfillment_week}</p>
            </div>
          </Panel>

          <Panel title="狀態">
            <QuickStatus orderId={order.id} status={order.status} />
            <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs">
              {[
                ["付款", order.paid_at],
                ["送達", order.delivered_at],
                ["取消", order.cancelled_at],
                ["退款", order.refunded_at],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-mute">{k}</dt>
                  <dd>{v ? formatHKT(v, "zh-HK") : "—"}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Stripe">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Checkout Session</dt>
                <dd><StripeLink id={order.stripe_checkout_session_id} kind="checkout/sessions" /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mute">PaymentIntent</dt>
                <dd><StripeLink id={order.stripe_payment_intent_id} kind="payments" /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Subscription</dt>
                <dd><StripeLink id={order.stripe_subscription_id} kind="subscriptions" /></dd>
              </div>
            </dl>
          </Panel>

          {order.paid_at && order.status !== "refunded" ? (
            <Panel title="退款">
              <RefundForm
                orderId={order.id}
                canCallStripe={Boolean(order.stripe_payment_intent_id) && isStripeConfigured()}
                amount={formatHKD(order.total_cents - order.refunded_cents)}
              />
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
