import Link from "next/link";
import { RevenueChart } from "@/components/admin/charts";
import { AdminPageHeader, AdminStatusBadge, Panel, StatTile, Table, Td, Th } from "@/components/admin/ui";
import { dailyRevenue, hktRanges, ordersCreatedBetween, ordersPaidBetween, statusCounts, summarize } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/auth/session";
import { feeConfig } from "@/lib/config";
import { formatHKD } from "@/lib/money";

const whole = (c: number) => formatHKD(Math.round(c / 100) * 100);
import { STATUS_LABEL_ZH } from "@/lib/orders/status";
import { ORDER_STATUSES } from "@/lib/validation";
import { cn, orderRef } from "@/lib/utils";
import { formatHKT } from "@/lib/weeks";

const PERIODS = [
  { key: "today", label: "今日" },
  { key: "week", label: "本週" },
  { key: "month", label: "本月" },
] as const;

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const periodKey = PERIODS.find((p) => p.key === sp.period)?.key ?? "week";
  const ranges = hktRanges();
  const range = ranges[periodKey];

  const thirtyDaysAgo = new Date(ranges.today.from.getTime() - 29 * 86_400_000);
  const [paid, paid30, created] = await Promise.all([
    ordersPaidBetween(range.from, range.to),
    ordersPaidBetween(thirtyDaysAgo, ranges.today.to),
    ordersCreatedBetween(ranges.month.from, ranges.month.to),
  ]);
  const s = summarize(paid);
  const series = dailyRevenue(paid30, thirtyDaysAgo, 30);
  const statuses = statusCounts(created);
  const maxStatus = Math.max(1, ...[...statuses.values()].map((v) => v.count));
  const recent = [...created].reverse().slice(0, 8);
  const margin = s.itemsRevenue ? Math.round((s.grossProfit / s.itemsRevenue) * 100) : 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="總覽"
        description="已付款訂單以付款時間（香港時間）計算。"
        actions={
          <nav className="flex rounded-full border border-line-strong p-1" aria-label="期間">
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={`/admin?period=${p.key}`}
                aria-current={p.key === periodKey ? "page" : undefined}
                className={cn("rounded-full px-4 py-1.5 text-sm transition", p.key === periodKey ? "bg-ink text-parchment" : "hover:bg-parchment-2")}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile emphasis label="已付 GMV" value={whole(s.gmv)} sub={`${s.orders} 張已付訂單`} />
        <StatTile label="預估毛利" value={whole(s.grossProfit)} sub={`餐點毛利率 ${margin}%（已扣退款）`} />
        <StatTile label="退款" value={whole(s.refunds)} sub="本期已付訂單的退款" />
        <StatTile
          label="淨額（扣退款及手續費）"
          value={whole(s.net)}
          sub={`估算 Stripe 手續費 ${formatHKD(s.fees)}（${feeConfig.bps / 100}% + ${formatHKD(feeConfig.fixedCents)}）`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="過去 30 日淨營業額（每日）" className="xl:col-span-2">
          <RevenueChart data={series} />
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-mute">數據表</summary>
            <div className="mt-2 max-h-56 overflow-y-auto">
              <table className="w-full">
                <tbody>
                  {series.map((d) => (
                    <tr key={d.date} className="border-b border-line">
                      <td className="py-1">{d.date}</td>
                      <td className="numeral py-1 text-right">{formatHKD(d.revenue)}</td>
                      <td className="py-1 text-right text-mute">{d.orders} 單</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Panel>
        <Panel title="本月訂單狀態">
          <ul className="space-y-3">
            {ORDER_STATUSES.map((st) => {
              const v = statuses.get(st) ?? { count: 0, amount: 0 };
              return (
                <li key={st}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-walnut">{STATUS_LABEL_ZH[st]}</span>
                    <span className="numeral text-sm text-ink">{v.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-parchment-2">
                    <div className="h-2 rounded-full bg-[#2E7D52]" style={{ width: `${(v.count / maxStatus) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel
        title="最新訂單（本月）"
        action={
          <Link href="/admin/orders" className="link-underline text-xs">
            全部訂單
          </Link>
        }
      >
        <div className="-m-5">
          <Table className="rounded-none border-0">
            <thead>
              <tr>
                <Th>訂單</Th>
                <Th>客戶</Th>
                <Th>週次</Th>
                <Th className="text-right">金額</Th>
                <Th>狀態</Th>
                <Th>建立時間</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-white">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="numeral link-underline font-medium">
                      {orderRef(o.order_number)}
                    </Link>
                  </Td>
                  <Td>{o.delivery_name}</Td>
                  <Td>{o.fulfillment_week}</Td>
                  <Td className="numeral text-right">{formatHKD(o.total_cents)}</Td>
                  <Td>
                    <AdminStatusBadge status={o.status} />
                  </Td>
                  <Td className="text-mute">{formatHKT(o.created_at, "zh-HK")}</Td>
                </tr>
              ))}
              {!recent.length ? (
                <tr>
                  <Td className="py-10 text-center text-mute">本月暫無訂單</Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
