import { describe, expect, it } from "vitest";
import { deliveryFeeCents, estimateStripeFeeCents } from "@/lib/config";
import { isDistrictValue } from "@/lib/districts";
import { formatHKD, parseHKDToCents } from "@/lib/money";
import { safeNext } from "@/lib/env";
import { kolDiscountCents, normalizeKolCode } from "@/lib/kol";
import { checkoutSchema, kolCreateSchema, normalizeHKPhone, signupSchema } from "@/lib/validation";

describe("money", () => {
  it("formats HKD cents", () => {
    expect(formatHKD(8800)).toBe("HK$88");
    expect(formatHKD(8850)).toBe("HK$88.50");
    expect(formatHKD(123456)).toBe("HK$1,234.56");
    expect(formatHKD(-4000)).toBe("−HK$40");
  });
  it("parses admin input", () => {
    expect(parseHKDToCents("HK$1,200")).toBe(120000);
    expect(parseHKDToCents("88.5")).toBe(8850);
    expect(parseHKDToCents("abc")).toBeNull();
  });
});

describe("delivery & fees", () => {
  it("is free from HK$400, else HK$40", () => {
    expect(deliveryFeeCents(0)).toBe(0);
    expect(deliveryFeeCents(39_999)).toBe(4_000);
    expect(deliveryFeeCents(40_000)).toBe(0);
  });
  it("estimates card fees (2.9% + HK$2.35 by default)", () => {
    expect(estimateStripeFeeCents(10_000)).toBe(290 + 235);
    expect(estimateStripeFeeCents(0)).toBe(0);
  });
});

describe("validation", () => {
  it("normalises Hong Kong phone numbers", () => {
    expect(normalizeHKPhone("91234567")).toBe("+852 9123 4567");
    expect(normalizeHKPhone("+852 9123-4567")).toBe("+852 9123 4567");
    expect(normalizeHKPhone("85221234567")).toBe("+852 2123 4567");
    expect(normalizeHKPhone("12345678")).toBeNull();
    expect(normalizeHKPhone("9123456")).toBeNull();
  });

  it("validates checkout input", () => {
    const ok = checkoutSchema.safeParse({
      mode: "cart",
      planId: "",
      name: "陳大文",
      phone: "9123 4567",
      district: "kowloon/觀塘區",
      address: "觀塘道 1 號 10 樓 A 室",
      notes: "",
      week: "2026-W41",
      saveDefault: "on",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.phone).toBe("+852 9123 4567");
      expect(ok.data.saveDefault).toBe(true);
    }
    const bad = checkoutSchema.safeParse({ mode: "cart", name: "", phone: "123", district: "mars/x", address: "", week: "x" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const keys = bad.error.issues.map((i) => i.message);
      expect(keys).toEqual(expect.arrayContaining(["name", "phone", "district", "address", "week"]));
    }
  });

  it("requires matching passwords of 8+ characters", () => {
    expect(signupSchema.safeParse({ email: "a@b.hk", password: "short", confirmPassword: "short" }).success).toBe(false);
    const mismatch = signupSchema.safeParse({ email: "a@b.hk", password: "longenough1", confirmPassword: "different1" });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(mismatch.error.issues[0].message).toBe("passwordMismatch");
    expect(signupSchema.safeParse({ email: "A@B.hk ", password: "longenough1", confirmPassword: "longenough1" }).success).toBe(true);
  });

  it("knows all 18 districts", () => {
    expect(isDistrictValue("hk_island/中西區")).toBe(true);
    expect(isDistrictValue("new_territories/離島區")).toBe(true);
    expect(isDistrictValue("kowloon/中西區")).toBe(false);
  });
});

describe("safeNext (open-redirect guard)", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/checkout?plan=1")).toBe("/checkout?plan=1");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext("/auth/callback")).toBe("/account");
    expect(safeNext(null, "/")).toBe("/");
  });
});

describe("KOL codes", () => {
  it("normalises codes", () => {
    expect(normalizeKolCode(" amy10 ")).toBe("AMY10");
    expect(normalizeKolCode("AB")).toBeNull();
    expect(normalizeKolCode("AMY-10")).toBeNull();
    expect(normalizeKolCode("0f8fad5b-d9cb-469f-a165-70867728950e")).toBeNull(); // OAuth ?code= values
  });

  it("computes the discount", () => {
    expect(kolDiscountCents({ code: "A10", percentOff: 10, amountOffCents: null }, 21_600)).toBe(2_160);
    expect(kolDiscountCents({ code: "A15", percentOff: 15, amountOffCents: null }, 8_850)).toBe(1_328); // rounds to the cent
    expect(kolDiscountCents({ code: "A50", percentOff: null, amountOffCents: 5_000 }, 21_600)).toBe(5_000);
    expect(kolDiscountCents({ code: "A50", percentOff: null, amountOffCents: 5_000 }, 3_000)).toBe(3_000); // never below zero
  });

  it("validates the admin form", () => {
    const ok = kolCreateSchema.parse({ instagram_handle: "@Amy.Eats", code: "amy10", discount_type: "percent", discount_value: "10" });
    expect(ok).toEqual({ instagram_handle: "amy.eats", code: "AMY10", percent_off: 10, amount_off_cents: null });
    const amount = kolCreateSchema.parse({ instagram_handle: "amy", code: "AMY50", discount_type: "amount", discount_value: "HK$50" });
    expect(amount).toMatchObject({ percent_off: null, amount_off_cents: 5_000 });
    expect(kolCreateSchema.safeParse({ instagram_handle: "amy", code: "AMY", discount_type: "percent", discount_value: "120" }).success).toBe(false);
    expect(kolCreateSchema.safeParse({ instagram_handle: "amy", code: "AMY", discount_type: "amount", discount_value: "0" }).success).toBe(false);
    expect(kolCreateSchema.safeParse({ instagram_handle: "amy eats!", code: "AMY", discount_type: "percent", discount_value: "10" }).success).toBe(false);
  });
});
