/** Cookie set by KOL links (`/?code=AMY10`); pre-fills the code at checkout. */
export const KOL_COOKIE = "lb_kol";

export const KOL_CODE_RE = /^[A-Z0-9]{3,20}$/;

export type KolDiscount = { code: string; percentOff: number | null; amountOffCents: number | null };

export function normalizeKolCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return KOL_CODE_RE.test(code) ? code : null;
}

/** What the code takes off `totalCents`. Stripe's own figure replaces this once the order is paid. */
export function kolDiscountCents(d: KolDiscount, totalCents: number): number {
  if (d.percentOff) return Math.round((totalCents * d.percentOff) / 100);
  return Math.min(d.amountOffCents ?? 0, totalCents);
}
