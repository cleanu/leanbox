import { SalesCogsChart } from "@/components/admin/charts";
import { AdminPageHeader, AdminStatusBadge, Panel, StatTile, Table, Td, Th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { byItem, dailyRevenue, hktDateKey, hktDateToUtc, hktRanges, ordersCreatedBetween, ordersPaidBetween, statusCounts, summarize } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/auth/session";
import { feeConfig } from "@/lib/config";
import { formatHKD } from "@/lib/money";

const whole = (c: number) => formatHKD(Math.round(c / 100) * 100);
import { ORDER_STATUSES } from "@/lib/validation";

export const metadata = { title: "財務" };

const DAY = 86_400_000;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function AdminFinancePage({ searchParams }: PageProps<"/admin/finance">) {
  await requireAdmin();
  const sp = await searchParams;
  const ranges = hktRanges();
  const fromParam = typeof sp.from === "string" ? hktDateToUtc(sp.from) : null;
  const toParam = typeof sp.to === "string" ? hktDateToUtc(sp.to) : null;
  const from = fromParam ?? ranges.month.from;
  // `to` is inclusive in the UI → exclusive bound is the next day.
  let to = toParam ? new Date(toParam.getTime() + DAY) : ranges.today.to;
  if (to <= from) to = new Date(from.getTime() + DAY);
  const days = Math.min(370, Math.round((to.getTime() - from.getTime()) / DAY));

  const [paid, created] = await Promise.all([ordersPaidBetween(from, to), ordersCreatedBetween(from, to)]);
  const s = summarize(paid);
  const daily = dailyRevenue(paid, from, days).filter((d) => d.orders > 0);
  const items = byItem(paid);
  const statuses = statusCounts(created);
  const fromLabel = hktDateKey(from);
  const toLabel = hktDateKey(new Date(to.getTime() - DAY));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="財務"
        description={`${fromLabel} 至 ${toLabel}（香港時間，以付款時間計）`}
        actions={
          <form className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-mute">
              由
              <input type="date" name="from" defaultValue={fromLabel} className="field h-10 py-0 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-mute">
              至
              <input type="date" name="to" defaultValue={toLabel} className="field h-10 py-0 text-sm" />
            </label>
            <button type="submit" className={buttonClass({ size: "sm", className: "h-10" })}>
              套用
            </button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile emphasis label="淨利（估算）" value={whole(s.netProfit)} sub="毛利 − 估算手續費" />
        <StatTile label="已付 GMV" value={whole(s.gmv)} sub={`${s.orders} 張已付訂單`} />
        <StatTile label="毛利（扣退款）" value={whole(s.grossProfit)} sub={`餐點毛利率 ${pct(s.itemsRevenue - s.cogs, s.itemsRevenue)}`} />
        <StatTile label="淨額（入帳估算）" value={whole(s.net)} sub="GMV − 退款 − 手續費" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="損益表" className="xl:col-span-2">
          <dl className="text-sm">
            {[
              ["餐點／計劃銷售", s.itemsRevenue, ""],
              ["運費收入", s.delivery, ""],
              ["折扣", -s.discounts, ""],
              ["已付 GMV", s.gmv, "font-medium border-t border-line-strong"],
              ["成本 (COGS)", -s.cogs, ""],
              ["退款", -s.refunds, ""],
              ["毛利（餐點銷售 − COGS − 退款）", s.grossProfit, "font-medium border-t border-line-strong"],
              [`估算 Stripe 手續費（${feeConfig.bps / 100}% + ${formatHKD(feeConfig.fixedCents)}／單）`, -s.fees, ""],
              ["淨利（估算）", s.netProfit, "font-semibold border-t-2 border-ink"],
            ].map(([label, value, cls]) => (
              <div key={String(label)} className={`flex justify-between gap-4 py-2 ${cls}`}>
                <dt className="text-walnut">{label}</dt>
                <dd className="numeral">{formatHKD(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[0.7rem] leading-relaxed text-mute">
            毛利 = Σ(單價 − 單位成本) × 數量（已付訂單）− 退款。運費視為收入但不計入餐點毛利。手續費為估算值，實際以 Stripe 報表為準。
          </p>
        </Panel>

        <Panel title="銷售 vs 成本（按餐點）" className="xl:col-span-3">
          {items.length ? (
            <SalesCogsChart data={items.slice(0, 10).map((i) => ({ name: i.name, sales: i.sales, cogs: i.cogs }))} />
          ) : (
            <p className="py-12 text-center text-sm text-mute">此期間沒有已付訂單</p>
          )}
        </Panel>
      </div>

      <Panel title="按餐點明細">
        <div className="-m-5">
          <Table className="rounded-none border-0">
            <thead>
              <tr>
                <Th>項目</Th>
                <Th className="text-right">數量</Th>
                <Th className="text-right">銷售額</Th>
                <Th className="text-right">成本</Th>
                <Th className="text-right">毛利</Th>
                <Th className="text-right">毛利率</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.key}>
                  <Td>{i.name}</Td>
                  <Td className="numeral text-right">{i.qty}</Td>
                  <Td className="numeral text-right">{formatHKD(i.sales)}</Td>
                  <Td className="numeral text-right text-mute">{formatHKD(i.cogs)}</Td>
                  <Td className="numeral text-right">{formatHKD(i.sales - i.cogs)}</Td>
                  <Td className="numeral text-right">{pct(i.sales - i.cogs, i.sales)}</Td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <Td className="py-10 text-center text-mute">—</Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="每日利潤">
          <div className="-m-5 max-h-[28rem] overflow-y-auto">
            <Table className="rounded-none border-0" compact>
              <thead>
                <tr>
                  <Th>日期</Th>
                  <Th className="text-right">訂單</Th>
                  <Th className="text-right">淨營業額</Th>
                  <Th className="text-right">淨利（估算）</Th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.date}>
                    <Td>{d.date}</Td>
                    <Td className="numeral text-right">{d.orders}</Td>
                    <Td className="numeral text-right">{formatHKD(d.revenue)}</Td>
                    <Td className="numeral text-right">{formatHKD(d.profit)}</Td>
                  </tr>
                ))}
                {!daily.length ? (
                  <tr>
                    <Td className="py-10 text-center text-mute">—</Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>
        </Panel>

        <Panel title="待付款 vs 已付（按建立時間）">
          <div className="-m-5">
            <Table className="rounded-none border-0" compact>
              <thead>
                <tr>
                  <Th>狀態</Th>
                  <Th className="text-right">訂單數</Th>
                  <Th className="text-right">金額</Th>
                </tr>
              </thead>
              <tbody>
                {ORDER_STATUSES.map((st) => {
                  const v = statuses.get(st) ?? { count: 0, amount: 0 };
                  return (
                    <tr key={st}>
                      <Td>
                        <AdminStatusBadge status={st} />
                      </Td>
                      <Td className="numeral text-right">{v.count}</Td>
                      <Td className="numeral text-right">{formatHKD(v.amount)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
