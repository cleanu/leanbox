import Link from "next/link";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { districtLabel } from "@/lib/districts";
import { formatHKD } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatHKT } from "@/lib/weeks";

export const metadata = { title: "客戶" };

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.replace(/[,()*%\\"]/g, " ").trim().slice(0, 80) : "";
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select("id, email, contact_email, full_name, phone, district, role, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (q) query = query.or(`email.ilike."%${q}%",full_name.ilike."%${q}%",phone.ilike."%${q}%",contact_email.ilike."%${q}%"`);
  const { data: customers } = await query;

  const ids = (customers ?? []).map((c) => c.id);
  const { data: orders } = ids.length
    ? await admin.from("orders").select("user_id, total_cents, refunded_cents, paid_at, created_at").in("user_id", ids).not("paid_at", "is", null).limit(10000)
    : { data: [] };

  const stats = new Map<string, { count: number; ltv: number; last: string | null }>();
  for (const o of orders ?? []) {
    if (!o.user_id) continue;
    const s = stats.get(o.user_id) ?? { count: 0, ltv: 0, last: null };
    s.count += 1;
    s.ltv += o.total_cents - o.refunded_cents;
    if (!s.last || (o.paid_at && o.paid_at > s.last)) s.last = o.paid_at;
    stats.set(o.user_id, s);
  }
  const rows = (customers ?? []).map((c) => ({ ...c, ...(stats.get(c.id) ?? { count: 0, ltv: 0, last: null }) })).sort((a, b) => b.ltv - a.ltv);
  const totalLtv = rows.reduce((s, r) => s + r.ltv, 0);
  const buyers = rows.filter((r) => r.count > 0).length;

  return (
    <div>
      <AdminPageHeader
        title="客戶"
        description={`${rows.length} 位用戶 · ${buyers} 位曾付款 · 平均 LTV ${formatHKD(buyers ? Math.round(totalLtv / buyers) : 0)}（已付客戶）`}
      />
      <form className="mb-6 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="搜尋電郵、姓名、電話" className="field h-10 max-w-sm py-0 text-sm" aria-label="搜尋客戶" />
        <button type="submit" className={buttonClass({ size: "sm", className: "h-10" })}>
          搜尋
        </button>
        {q ? (
          <Link href="/admin/customers" className={buttonClass({ variant: "ghost", size: "sm", className: "h-10" })}>
            清除
          </Link>
        ) : null}
      </form>
      <Table>
        <thead>
          <tr>
            <Th>客戶</Th>
            <Th>電話</Th>
            <Th>預設地區</Th>
            <Th className="text-right">已付訂單</Th>
            <Th className="text-right">LTV（扣退款）</Th>
            <Th>最近付款</Th>
            <Th>註冊</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-white">
              <Td>
                <p className="font-medium">
                  {c.full_name || "—"} {c.role === "admin" ? <Badge tone="ink">admin</Badge> : null}
                </p>
                <p className="text-[0.7rem] text-mute">{c.email ?? c.contact_email ?? "（Apple 未提供電郵）"}</p>
              </Td>
              <Td className="text-xs">{c.phone ?? "—"}</Td>
              <Td className="text-xs">{districtLabel(c.district, "zh-HK")}</Td>
              <Td className="numeral text-right">
                {c.count ? (
                  <Link href={`/admin/orders?q=${encodeURIComponent(c.email ?? c.phone ?? "")}`} className="link-underline">
                    {c.count}
                  </Link>
                ) : (
                  0
                )}
              </Td>
              <Td className="numeral text-right">{formatHKD(c.ltv)}</Td>
              <Td className="text-xs text-mute">{c.last ? formatHKT(c.last, "zh-HK", { dateStyle: "medium" }) : "—"}</Td>
              <Td className="text-xs text-mute">{formatHKT(c.created_at, "zh-HK", { dateStyle: "medium" })}</Td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <Td className="py-12 text-center text-mute">暫無客戶</Td>
            </tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}
