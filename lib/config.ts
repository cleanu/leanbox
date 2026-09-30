/**
 * Business rules in one place. Anything here is safe to import on the client.
 */
export const shopConfig = {
  currency: "hkd" as const,
  /** Delivery: free at or above the threshold, otherwise a flat fee. */
  delivery: {
    freeThresholdCents: 40_000, // HK$400
    feeCents: 4_000, // HK$40
  },
  /**
   * Weekly order cutoff in Hong Kong time. Orders placed before the cutoff join
   * the delivery batch for the following Monday–Sunday week.
   * weekday: 0 = Sunday … 6 = Saturday.
   */
  cutoff: {
    weekday: Number(process.env.NEXT_PUBLIC_CUTOFF_WEEKDAY ?? 0),
    hour: Number(process.env.NEXT_PUBLIC_CUTOFF_HOUR ?? 23),
    minute: Number(process.env.NEXT_PUBLIC_CUTOFF_MINUTE ?? 59),
    utcOffsetHours: 8, // Asia/Hong_Kong has no DST
  },
  maxQtyPerLine: 20,
  contact: {
    phoneDisplay: "+852 0000 0000",
    phoneHref: "tel:+85200000000",
    whatsappHref: "https://wa.me/85200000000", // TODO: replace with the real WhatsApp Business number
    email: "hello@leanbox.hk",
    instagram: "https://instagram.com/",
  },
};

/**
 * Estimated card processing fee used for the admin "net" figures. Stripe's
 * Hong Kong pricing changes over time — check stripe.com/hk/pricing and set
 * STRIPE_FEE_BPS / STRIPE_FEE_FIXED_CENTS accordingly.
 */
export const feeConfig = {
  bps: Number(process.env.STRIPE_FEE_BPS ?? 290), // 2.9%
  fixedCents: Number(process.env.STRIPE_FEE_FIXED_CENTS ?? 235), // HK$2.35
};

export function deliveryFeeCents(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= shopConfig.delivery.freeThresholdCents ? 0 : shopConfig.delivery.feeCents;
}

export function estimateStripeFeeCents(amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.round((amountCents * feeConfig.bps) / 10_000) + feeConfig.fixedCents;
}
