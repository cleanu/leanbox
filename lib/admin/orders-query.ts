import "server-only";
import { isDistrictValue } from "@/lib/districts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { ORDER_STATUSES } from "@/lib/validation";

export type OrderFilters = { status?: OrderStatus; week?: string; district?: string; q?: string; page: number };

export function parseOrderFilters(sp: Record<string, string | string[] | undefined>): OrderFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const status = get("status");
  const week = get("week");
  const district = get("district");
  return {
    status: (ORDER_STATUSES as readonly string[]).includes(status) ? (status as OrderStatus) : undefined,
    week: /^\d{4}-W\d{2}$/.test(week) ? week : undefined,
    district: district && (isDistrictValue(district) || /^(hk_island|kowloon|new_territories)$/.test(district)) ? district : undefined,
    q: get("q").slice(0, 80) || undefined,
    page: Math.max(1, Number(get("page")) || 1),
  };
}

export const PAGE_SIZE = 50;

/** Admin order search. Search matches order no. (LB-100123 / 100123), order id, email, phone or name. */
export async function queryOrders(f: OrderFilters, opts: { limit?: number; offset?: number } = {}) {
  let q = createAdminClient()
    .from("orders")
    .select(
      "id, order_number, status, kind, fulfillment_week, total_cents, subtotal_cents, delivery_cents, refunded_cents, created_at, paid_at, delivery_name, delivery_phone, delivery_district, delivery_address, delivery_notes, customer_email, stripe_payment_intent_id, order_items(quantity, name_snapshot, unit_price_cents, unit_cost_cents)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (f.status) q = q.eq("status", f.status);
  if (f.week) q = q.eq("fulfillment_week", f.week);
  if (f.district) q = f.district.includes("/") ? q.eq("delivery_district", f.district) : q.like("delivery_district", `${f.district}/%`);
  if (f.q) {
    const term = f.q.replace(/[,()*%\\"]/g, " ").trim();
    const digits = term.replace(/^lb-?/i, "");
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)) q = q.eq("id", term);
    else if (/^\d{6,}$/.test(digits) && digits.length <= 9) q = q.eq("order_number", Number(digits));
    else if (term) {
      const like = `"%${term}%"`;
      const phoneDigits = term.replace(/\D/g, "").replace(/^852(?=\d{8}$)/, "");
      // Phones are stored as "+852 XXXX XXXX"; also match a run of 8 digits.
      const phoneLike = /^\d{8}$/.test(phoneDigits) ? `,delivery_phone.ilike."%${phoneDigits.slice(0, 4)} ${phoneDigits.slice(4)}%"` : "";
      q = q.or(`customer_email.ilike.${like},delivery_phone.ilike.${like},delivery_name.ilike.${like}${phoneLike}`);
    }
  }
  const limit = opts.limit ?? PAGE_SIZE;
  const offset = opts.offset ?? (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  return { orders: data ?? [], count: count ?? 0 };
}
