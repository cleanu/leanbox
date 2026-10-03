import "server-only";
import { isServiceRoleConfigured } from "@/lib/env.server";
import { normalizeKolCode, type KolDiscount } from "@/lib/kol";
import { createAdminClient } from "@/lib/supabase/admin";

/** An active KOL code, or null. kol_codes is admin-only, so this reads with the service role. */
export async function findActiveKolCode(input: string) {
  const code = normalizeKolCode(input);
  if (!code || !isServiceRoleConfigured()) return null;
  const { data } = await createAdminClient()
    .from("kol_codes")
    .select("id, code, percent_off, amount_off_cents, stripe_promotion_code_id")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export function toKolDiscount(row: { code: string; percent_off: number | null; amount_off_cents: number | null }): KolDiscount {
  return { code: row.code, percentOff: row.percent_off, amountOffCents: row.amount_off_cents };
}
