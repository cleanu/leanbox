import "server-only";
import { estimateStripeFeeCents } from "@/lib/config";
import { PAID_STATUSES } from "@/lib/orders/status";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/supabase/database.types";

const HKT = 8 * 3_600_000;
const DAY = 86_400_000;

export const ADMIN_ORDER_SELECT =
  "id, order_number, status, kind, fulfillment_week, subtotal_cents, delivery_cents, discount_cents, total_cents, refunded_cents, paid_at, created_at, delivery_district, delivery_name, delivery_phone, customer_email, user_id, order_items(quantity, unit_price_cents, unit_cost_cents, meal_id, plan_id, name_snapshot)" as const;

export type AdminOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  kind: "one_time" | "subscription";
  fulfillment_week: string;
  subtotal_cents: number;
  delivery_cents: number;
  discount_cents: number;
  total_cents: number;
  refunded_cents: number;
  paid_at: string | null;
  created_at: string;
  delivery_district: string;
  delivery_name: string;
  delivery_phone: string;
  customer_email: string | null;
  user_id: string | null;
  order_items: { quantity: number; unit_price_cents: number; unit_cost_cents: number; meal_id: string | null; plan_id: string | null; name_snapshot: string }[];
};

/** Start of the HKT day/week/month containing `now`, as UTC Dates. */
export function hktRanges(now = new Date()) {
  const wall = now.getTime() + HKT;
  const d = new Date(wall);
  const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const weekStart = dayStart - ((d.getUTCDay() + 6) % 7) * DAY;
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const toUtc = (w: number) => new Date(w - HKT);
  const end = toUtc(dayStart + DAY);
  return {
    today: { from: toUtc(dayStart), to: end },
    week: { from: toUtc(weekStart), to: end },
    month: { from: toUtc(monthStart), to: end },
  };
}

/** "YYYY-MM-DD" (HKT) → UTC instant at HKT midnight. */
export function hktDateToUtc(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - HKT);
}

export function hktDateKey(iso: string | Date): string {
  const t = (typeof iso === "string" ? new Date(iso) : iso).getTime() + HKT;
  return new Date(t).toISOString().slice(0, 10);
}

/** Orders paid within [from, to). Capped at 5,000 rows — move to SQL views as volume grows. */
export async function ordersPaidBetween(from: Date, to: Date): Promise<AdminOrder[]> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ADMIN_ORDER_SELECT)
    .gte("paid_at", from.toISOString())
    .lt("paid_at", to.toISOString())
    .order("paid_at", { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as AdminOrder[];
}

export async function ordersCreatedBetween(from: Date, to: Date): Promise<AdminOrder[]> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ADMIN_ORDER_SELECT)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as AdminOrder[];
}

export type Summary = {
  orders: number;
  gmv: number; // paid totals incl. delivery
  itemsRevenue: number;
  cogs: number;
  delivery: number;
  discounts: number;
  refunds: number;
  grossProfit: number; // Σ(price − cost)×qty − refunds
  fees: number; // estimated card fees
  net: number; // GMV − refunds − fees
  netProfit: number; // grossProfit − fees
};

/**
 * Profit = Σ (unit_price − unit_cost) × qty over paid orders, minus refunds.
 * Orders count as paid once paid_at is set (later refunds are subtracted, not
 * excluded). Stripe fees are an estimate from STRIPE_FEE_BPS / _FIXED_CENTS.
 */
export function summarize(orders: AdminOrder[]): Summary {
  const s: Summary = { orders: 0, gmv: 0, itemsRevenue: 0, cogs: 0, delivery: 0, discounts: 0, refunds: 0, grossProfit: 0, fees: 0, net: 0, netProfit: 0 };
  for (const o of orders) {
    if (!o.paid_at) continue;
    s.orders += 1;
    s.gmv += o.total_cents;
    s.delivery += o.delivery_cents;
    s.discounts += o.discount_cents;
    s.refunds += o.refunded_cents;
    s.fees += estimateStripeFeeCents(o.total_cents);
    for (const i of o.order_items) {
      s.itemsRevenue += i.unit_price_cents * i.quantity;
      s.cogs += i.unit_cost_cents * i.quantity;
    }
  }
  s.grossProfit = s.itemsRevenue - s.cogs - s.refunds;
  s.net = s.gmv - s.refunds - s.fees;
  s.netProfit = s.grossProfit - s.fees;
  return s;
}

export function dailyRevenue(orders: AdminOrder[], from: Date, days: number) {
  const buckets = new Map<string, { revenue: number; orders: number; profit: number }>();
  for (let i = 0; i < days; i++) buckets.set(hktDateKey(new Date(from.getTime() + i * DAY)), { revenue: 0, orders: 0, profit: 0 });
  for (const o of orders) {
    if (!o.paid_at) continue;
    const b = buckets.get(hktDateKey(o.paid_at));
    if (!b) continue;
    b.revenue += o.total_cents - o.refunded_cents;
    b.orders += 1;
    b.profit += o.order_items.reduce((s, i) => s + (i.unit_price_cents - i.unit_cost_cents) * i.quantity, 0) - o.refunded_cents - estimateStripeFeeCents(o.total_cents);
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
}

export function byItem(orders: AdminOrder[]) {
  const rows = new Map<string, { key: string; name: string; qty: number; sales: number; cogs: number }>();
  for (const o of orders) {
    if (!o.paid_at) continue;
    for (const i of o.order_items) {
      const key = i.meal_id ?? i.plan_id ?? i.name_snapshot;
      const r = rows.get(key) ?? { key, name: i.name_snapshot, qty: 0, sales: 0, cogs: 0 };
      r.qty += i.quantity;
      r.sales += i.unit_price_cents * i.quantity;
      r.cogs += i.unit_cost_cents * i.quantity;
      rows.set(key, r);
    }
  }
  return [...rows.values()].sort((a, b) => b.sales - a.sales);
}

export function statusCounts(orders: AdminOrder[]) {
  const counts = new Map<OrderStatus, { count: number; amount: number }>();
  for (const o of orders) {
    const c = counts.get(o.status) ?? { count: 0, amount: 0 };
    c.count += 1;
    c.amount += o.total_cents;
    counts.set(o.status, c);
  }
  return counts;
}

export function isPaidStatus(status: OrderStatus) {
  return PAID_STATUSES.includes(status);
}
