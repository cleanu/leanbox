import { describe, expect, it } from "vitest";
import { formatWeekRange, isWeekOpen, openDeliveryWeeks, weekById } from "@/lib/weeks";

// Helper: a Hong Kong wall-clock time as a Date.
const hkt = (s: string) => new Date(`${s}+08:00`);

describe("delivery weeks (cutoff Sunday 23:59 HKT)", () => {
  it("on a Monday, the next open batch is the following week", () => {
    const [a, b] = openDeliveryWeeks(hkt("2026-09-28T12:00:00"));
    expect(a).toMatchObject({ id: "2026-W41", startDate: "2026-10-05", endDate: "2026-10-11" });
    expect(b.id).toBe("2026-W42");
    expect(new Date(a.cutoffAt).toISOString()).toBe(hkt("2026-10-04T23:59:59.999").toISOString());
  });

  it("just before the cutoff the week is still open", () => {
    expect(openDeliveryWeeks(hkt("2026-10-04T23:59:30"))[0].id).toBe("2026-W41");
  });

  it("just after the cutoff the week closes", () => {
    const now = hkt("2026-10-05T00:00:30");
    expect(openDeliveryWeeks(now)[0].id).toBe("2026-W42");
    expect(isWeekOpen("2026-W41", now)).toBe(false);
    expect(isWeekOpen("2026-W43", now)).toBe(true);
  });

  it("handles ISO week-year boundaries", () => {
    // 2026 has 53 ISO weeks; 2027-W01 starts Monday 4 Jan 2027.
    expect(weekById("2026-W53")?.startDate).toBe("2026-12-28");
    expect(openDeliveryWeeks(hkt("2026-12-30T10:00:00"))[0].id).toBe("2027-W01");
    expect(weekById("2027-W01")?.startDate).toBe("2027-01-04");
  });

  it("formats ranges in both languages", () => {
    const w = weekById("2026-W41")!;
    expect(formatWeekRange(w, "zh-HK")).toBe("10月5日 – 10月11日");
    expect(formatWeekRange(w, "en")).toBe("5 Oct – 11 Oct");
  });
});
