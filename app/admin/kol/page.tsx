import Link from "next/link";
import { KolCreateForm, KolEditForm } from "@/components/admin/kol-forms";
import { AdminPageHeader, AdminStatusBadge, DateRangeForm, Panel, StatTile, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { byKolCode, hktDateKey, ordersPaidBetween, parseDateRange } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/auth/session";
import { siteUrl } from "@/lib/env";
import { formatHKD } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderRef } from "@/lib/utils";

export const metadata = { title: "KOL 折扣碼" };

const discountLabel = (k: { percent_off: number | null; amount_off_cents: number | null }) =>
  k.percent_off ? `${k.percent_off}%` : formatHKD(k.amount_off_cents);

export default async function AdminKolPage({ searchParams }: PageProps<"/admin/kol">) {
  await requireAdmin();
  const sp = await searchParams;
  const { from, to, fromLabel, toLabel } = parseDateRange(sp);
  const [{ data }, orders] = await Promise.all([
    createAdminClient().from("kol_codes").select("*").order("created_at", { ascending: false }),
    ordersPaidBetween(from, to, { kolOnly: true }),
  ]);
  const stats = byKolCode(orders);
  const codes = [...(data ?? [])].sort((a, b) => (stats.get(b.id)?.paid ?? 0) - (stats.get(a.id)?.paid ?? 0));
  const all = [...stats.values()];
  const sum = (k: "orders" | "discount" | "paid" | "refunds") => all.reduce((t, s) => t + s[k], 0);
  const range = `from=${fromLabel}&to=${toLabel}`;
  const selected = codes.find((c) => c.id === sp.kol) ?? null;
  const selectedOrders = selected ? orders.filter((o) => o.kol_code_id === selected.id).reverse() : [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="KOL 折扣碼"
        description={`${fromLabel} 至 ${toLabel}（香港時間，以付款時間計）`}
        actions={<DateRangeForm from={fromLabel} to={toLabel} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile emphasis label="KOL 帶來實收" value={formatHKD(sum("paid"))} sub="已扣折扣，未扣退款" />
        <StatTile label="訂單" value={String(sum("orders"))} sub="包括每週計劃續訂" />
        <StatTile label="折扣總額" value={formatHKD(sum("discount"))} />
        <StatTile label="退款" value={formatHKD(sum("refunds"))} />
      </div>

      {codes.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Instagram</Th>
              <Th>折扣碼</Th>
              <Th>折扣</Th>
              <Th className="text-right">訂單</Th>
              <Th className="text-right">客戶</Th>
              <Th className="text-right">原價</Th>
              <Th className="text-right">折扣額</Th>
              <Th className="text-right">實收</Th>
              <Th className="text-right">退款</Th>
              <Th>狀態</Th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => {
              const s = stats.get(c.id);
              return (
                <tr key={c.id} className={c.id === selected?.id ? "bg-parchment-2/60" : undefined}>
                  <Td>
                    <a href={`https://www.instagram.com/${c.instagram_handle}/`} target="_blank" rel="noopener noreferrer" className="link-underline">
                      @{c.instagram_handle}
                    </a>
                  </Td>
                  <Td>
                    <Link href={`/admin/kol?kol=${c.id}&${range}`} className="link-underline font-mono">
                      {c.code}
                    </Link>
                  </Td>
                  <Td>{discountLabel(c)}</Td>
                  <Td className="numeral text-right">{s?.orders ?? 0}</Td>
                  <Td className="numeral text-right">{s?.customers ?? 0}</Td>
                  <Td className="numeral text-right">{formatHKD(s?.gross ?? 0)}</Td>
                  <Td className="numeral text-right">{formatHKD(s?.discount ?? 0)}</Td>
                  <Td className="numeral text-right font-medium">{formatHKD(s?.paid ?? 0)}</Td>
                  <Td className="numeral text-right">{formatHKD(s?.refunds ?? 0)}</Td>
                  <Td>{c.is_active ? <Badge tone="olive">啟用</Badge> : <Badge tone="muted">已停用</Badge>}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <Panel>
          <p className="text-sm text-mute">未有 KOL 折扣碼。在下面建立第一個。</p>
        </Panel>
      )}

      {selected ? (
        <Panel
          title={`@${selected.instagram_handle} · ${selected.code}（${discountLabel(selected)}）`}
          action={
            <Link href={`/admin/kol?${range}`} className="text-xs text-mute hover:text-ink">
              關閉
            </Link>
          }
        >
          <KolEditForm key={selected.id} kol={selected} link={siteUrl(`/?code=${selected.code}`)} />
          <h3 className="mb-3 mt-8 font-sans text-sm font-medium text-walnut">此期間的訂單（{selectedOrders.length}）</h3>
          {selectedOrders.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>訂單</Th>
                  <Th>付款日期</Th>
                  <Th>顧客</Th>
                  <Th>類型</Th>
                  <Th className="text-right">原價</Th>
                  <Th className="text-right">折扣</Th>
                  <Th className="text-right">實收</Th>
                  <Th>狀態</Th>
                </tr>
              </thead>
              <tbody>
                {selectedOrders.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="link-underline font-mono">
                        {orderRef(o.order_number)}
                      </Link>
                    </Td>
                    <Td>{o.paid_at ? hktDateKey(o.paid_at) : "—"}</Td>
                    <Td>{o.customer_email ?? o.delivery_name}</Td>
                    <Td>{o.kind === "subscription" ? "每週計劃" : "單次"}</Td>
                    <Td className="numeral text-right">{formatHKD(o.total_cents + o.discount_cents)}</Td>
                    <Td className="numeral text-right">{formatHKD(o.discount_cents)}</Td>
                    <Td className="numeral text-right">{formatHKD(o.total_cents)}</Td>
                    <Td>
                      <AdminStatusBadge status={o.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-sm text-mute">此期間未有使用此折扣碼的已付款訂單。</p>
          )}
        </Panel>
      ) : null}

      <Panel title="新增 KOL 折扣碼">
        <KolCreateForm />
      </Panel>
    </div>
  );
}
