import { type NextRequest } from "next/server";
import { audit } from "@/lib/admin/audit";
import { parseOrderFilters, queryOrders } from "@/lib/admin/orders-query";
import { requireAdmin } from "@/lib/auth/session";
import { districtLabel } from "@/lib/districts";
import { STATUS_LABEL_ZH } from "@/lib/orders/status";
import { orderRef } from "@/lib/utils";
import { formatHKT } from "@/lib/weeks";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything; neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const money = (c: number) => (c / 100).toFixed(2);

export async function GET(request: NextRequest) {
  const { user } = await requireAdmin(); // 404 for non-admins
  const filters = parseOrderFilters(Object.fromEntries(request.nextUrl.searchParams));
  const { orders } = await queryOrders(filters, { limit: 5000, offset: 0 });

  const header = [
    "訂單號", "狀態", "週次", "下單時間(HKT)", "付款時間(HKT)", "姓名", "電話", "電郵", "地區", "地址", "備註",
    "餐點", "餐數", "小計", "運費", "總額", "退款", "成本", "毛利", "Stripe PaymentIntent",
  ];
  const rows = orders.map((o) => {
    const qty = o.order_items.reduce((s, i) => s + i.quantity, 0);
    const cost = o.order_items.reduce((s, i) => s + i.unit_cost_cents * i.quantity, 0);
    const items = o.order_items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    return [
      orderRef(o.order_number),
      STATUS_LABEL_ZH[o.status],
      o.fulfillment_week,
      formatHKT(o.created_at, "zh-HK"),
      o.paid_at ? formatHKT(o.paid_at, "zh-HK") : "",
      o.delivery_name,
      o.delivery_phone,
      o.customer_email,
      districtLabel(o.delivery_district, "zh-HK"),
      o.delivery_address,
      o.delivery_notes,
      o.order_items.map((i) => `${i.name_snapshot} ×${i.quantity}`).join("; "),
      qty,
      money(o.subtotal_cents),
      money(o.delivery_cents),
      money(o.total_cents),
      money(o.refunded_cents),
      money(cost),
      o.paid_at ? money(items - cost - o.refunded_cents) : "",
      o.stripe_payment_intent_id,
    ].map(cell);
  });

  await audit(user.id, "orders.export", "orders", null, { count: orders.length, filters: { ...filters } });

  // BOM so Excel opens UTF-8 Chinese correctly.
  const csv = "﻿" + [header.map(cell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leanbox-orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
