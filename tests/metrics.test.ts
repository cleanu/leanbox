import { describe, expect, it } from "vitest";
import { byItem, dailyRevenue, hktDateKey, hktRanges, summarize, type AdminOrder } from "@/lib/admin/metrics";

const order = (over: Partial<AdminOrder>): AdminOrder => ({
  id: crypto.randomUUID(),
  order_number: 100001,
  status: "paid",
  kind: "one_time",
  fulfillment_week: "2026-W41",
  subtotal_cents: 0,
  delivery_cents: 0,
  discount_cents: 0,
  total_cents: 0,
  refunded_cents: 0,
  paid_at: "2026-09-28T04:00:00.000Z",
  created_at: "2026-09-28T03:59:00.000Z",
  delivery_district: "kowloon/觀塘區",
  delivery_name: "A",
  delivery_phone: "+852 9123 4567",
  customer_email: null,
  user_id: null,
  order_items: [],
  ...over,
});

describe("profit maths", () => {
  const orders = [
    order({
      subtotal_cents: 17_600,
      delivery_cents: 4_000,
      total_cents: 21_600,
      order_items: [{ quantity: 2, unit_price_cents: 8_800, unit_cost_cents: 3_200, meal_id: "m1", plan_id: null, name_snapshot: "雞" }],
    }),
    order({
      subtotal_cents: 49_000,
      total_cents: 49_000,
      refunded_cents: 9_800,
      status: "paid",
      order_items: [
        { quantity: 5, unit_price_cents: 9_800, unit_cost_cents: 4_200, meal_id: "m2", plan_id: null, name_snapshot: "三文魚" },
      ],
    }),
    order({ paid_at: null, status: "pending_payment", total_cents: 99_900 }), // ignored
  ];

  it("computes margin minus refunds and fees", () => {
    const s = summarize(orders);
    expect(s.orders).toBe(2);
    expect(s.gmv).toBe(21_600 + 49_000);
    expect(s.itemsRevenue).toBe(17_600 + 49_000);
    expect(s.cogs).toBe(6_400 + 21_000);
    expect(s.refunds).toBe(9_800);
    expect(s.grossProfit).toBe(17_600 + 49_000 - 6_400 - 21_000 - 9_800);
    expect(s.fees).toBe(Math.round(21_600 * 0.029) + 235 + Math.round(49_000 * 0.029) + 235);
    expect(s.netProfit).toBe(s.grossProfit - s.fees);
    expect(s.net).toBe(s.gmv - s.refunds - s.fees);
  });

  it("groups by item", () => {
    const rows = byItem(orders);
    expect(rows[0]).toMatchObject({ key: "m2", qty: 5, sales: 49_000, cogs: 21_000 });
  });

  it("buckets by Hong Kong day", () => {
    // 2026-09-27T17:30Z is 01:30 on the 28th in Hong Kong.
    expect(hktDateKey("2026-09-27T17:30:00.000Z")).toBe("2026-09-28");
    const series = dailyRevenue(orders, new Date("2026-09-27T16:00:00.000Z"), 2);
    expect(series.map((d) => d.date)).toEqual(["2026-09-28", "2026-09-29"]);
    expect(series[0].orders).toBe(2);
  });

  it("computes HKT period starts", () => {
    const r = hktRanges(new Date("2026-09-30T20:00:00.000Z")); // Thu 1 Oct 04:00 HKT
    expect(r.today.from.toISOString()).toBe("2026-09-30T16:00:00.000Z");
    expect(r.week.from.toISOString()).toBe("2026-09-27T16:00:00.000Z"); // Mon 28 Sep HKT
    expect(r.month.from.toISOString()).toBe("2026-09-30T16:00:00.000Z"); // 1 Oct HKT
  });
});
