import { Download } from "lucide-react";
import Link from "next/link";
import { StatusSelect } from "@/components/admin/status-select";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { parseOrderFilters, PAGE_SIZE, queryOrders } from "@/lib/admin/orders-query";
import { requireAdmin } from "@/lib/auth/session";
import { districtLabel, REGIONS } from "@/lib/districts";
import { formatHKD } from "@/lib/money";
import { STATUS_LABEL_ZH } from "@/lib/orders/status";
import { ORDER_STATUSES } from "@/lib/validation";
import { orderRef } from "@/lib/utils";
import { formatHKT, openDeliveryWeeks } from "@/lib/weeks";

export const metadata = { title: "訂單" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = parseOrderFilters(sp);
  const { orders, count } = await queryOrders(filters);
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // Week options: the two open weeks plus the previous four.
  const open = openDeliveryWeeks(new Date(), 2).map((w) => w.id);
  const weekOptions = [...new Set([...open, ...orders.map((o) => o.fulfillment_week)])].sort().reverse();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries({ status: filters.status, week: filters.week, district: filters.district, q: filters.q })) if (v) qs.set(k, v);
  const pageHref = (p: number) => `/admin/orders?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) })}`;

  return (
    <div>
      <AdminPageHeader
        title="訂單"
        description={`共 ${count} 張訂單`}
        actions={
          <a href={`/admin/orders/export?${qs}`} className={buttonClass({ variant: "outline", size: "sm" })}>
            <Download className="size-3.5" aria-hidden /> 匯出 CSV
          </a>
        }
      />

      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-[#FBF8F2] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(3,11rem)_auto]" role="search">
        <input name="q" defaultValue={filters.q} placeholder="搜尋訂單號、電郵、電話、姓名" className="field h-10 py-0 text-sm" aria-label="搜尋" />
        <select name="status" defaultValue={filters.status ?? ""} className="field h-10 py-0 text-sm" aria-label="狀態">
          <option value="">全部狀態</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_ZH[s]}
            </option>
          ))}
        </select>
        <select name="week" defaultValue={filters.week ?? ""} className="field h-10 py-0 text-sm" aria-label="週次">
          <option value="">全部週次</option>
          {weekOptions.map((w) => (
            <option key={w} value={w}>
              {w}
              {open.includes(w) ? "（開放中）" : ""}
            </option>
          ))}
        </select>
        <select name="district" defaultValue={filters.district ?? ""} className="field h-10 py-0 text-sm" aria-label="地區">
          <option value="">全部地區</option>
          {REGIONS.map((r) => (
            <optgroup key={r.id} label={r.zh}>
              <option value={r.id}>{r.zh}（全部）</option>
              {r.districts.map((d) => (
                <option key={d.zh} value={`${r.id}/${d.zh}`}>
                  {d.zh}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass({ size: "sm", className: "h-10" })}>
            篩選
          </button>
          <Link href="/admin/orders" className={buttonClass({ variant: "ghost", size: "sm", className: "h-10" })}>
            重設
          </Link>
        </div>
      </form>

      <Table>
        <thead>
          <tr>
            <Th>訂單</Th>
            <Th>客戶</Th>
            <Th>地區</Th>
            <Th>週次</Th>
            <Th className="text-right">餐數</Th>
            <Th className="text-right">金額</Th>
            <Th className="text-right">毛利</Th>
            <Th>狀態</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const qty = o.order_items.reduce((s, i) => s + i.quantity, 0);
            const margin = o.order_items.reduce((s, i) => s + (i.unit_price_cents - i.unit_cost_cents) * i.quantity, 0) - o.refunded_cents;
            return (
              <tr key={o.id} className="hover:bg-white">
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="numeral link-underline font-medium">
                    {orderRef(o.order_number)}
                  </Link>
                  <p className="text-[0.7rem] text-mute">{formatHKT(o.created_at, "zh-HK")}</p>
                </Td>
                <Td>
                  <p>{o.delivery_name}</p>
                  <p className="text-[0.7rem] text-mute">
                    {o.delivery_phone}
                    {o.customer_email ? ` · ${o.customer_email}` : ""}
                  </p>
                </Td>
                <Td className="text-xs">{districtLabel(o.delivery_district, "zh-HK")}</Td>
                <Td className="text-xs">{o.fulfillment_week}</Td>
                <Td className="numeral text-right">{qty}</Td>
                <Td className="numeral text-right">{formatHKD(o.total_cents)}</Td>
                <Td className={`numeral text-right ${o.paid_at ? "" : "text-mute"}`}>{o.paid_at ? formatHKD(margin) : "—"}</Td>
                <Td>
                  <StatusSelect orderId={o.id} status={o.status} compact />
                </Td>
              </tr>
            );
          })}
          {!orders.length ? (
            <tr>
              <Td className="py-12 text-center text-mute">沒有符合條件的訂單</Td>
            </tr>
          ) : null}
        </tbody>
      </Table>

      {pages > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="分頁">
          <span className="text-mute">
            第 {filters.page} / {pages} 頁
          </span>
          <div className="flex gap-2">
            {filters.page > 1 ? (
              <Link href={pageHref(filters.page - 1)} className={buttonClass({ variant: "outline", size: "sm" })}>
                上一頁
              </Link>
            ) : null}
            {filters.page < pages ? (
              <Link href={pageHref(filters.page + 1)} className={buttonClass({ variant: "outline", size: "sm" })}>
                下一頁
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
