"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, kolCreateSchema, kolUpdateSchema } from "@/lib/validation";

export type KolFormState = { ok?: boolean; error?: string; fields?: Record<string, string>; nonce?: number };

/**
 * Creates the Stripe Coupon + Promotion Code first (Stripe validates and applies
 * the discount), then the kol_codes row. Coupons are "forever" so weekly plans
 * stay discounted. Stripe coupons can't change amount — to change a discount,
 * deactivate the code and create a new one.
 */
export async function createKolCodeAction(_prev: KolFormState, formData: FormData): Promise<KolFormState> {
  const { user } = await requireAdmin();
  const parsed = kolCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fields: fieldErrors(parsed.error), error: "請檢查標示的欄位" };
  const { instagram_handle, code, percent_off, amount_off_cents } = parsed.data;

  const admin = createAdminClient();
  const { data: taken } = await admin.from("kol_codes").select("id").eq("code", code).maybeSingle();
  if (taken) return { fields: { code: "此折扣碼已存在" }, error: "請檢查標示的欄位" };

  const stripe = getStripe();
  let couponId: string | null = null;
  let promoId: string;
  try {
    const coupon = await stripe.coupons.create({
      ...(percent_off ? { percent_off } : { amount_off: amount_off_cents!, currency: "hkd" }),
      duration: "forever",
      name: `KOL @${instagram_handle}`.slice(0, 40),
      metadata: { instagram_handle },
    });
    couponId = coupon.id;
    const promo = await stripe.promotionCodes.create({ promotion: { type: "coupon", coupon: coupon.id }, code, metadata: { instagram_handle } });
    promoId = promo.id;
  } catch (err) {
    if (couponId) await stripe.coupons.del(couponId).catch(() => {});
    return { error: `Stripe：${(err as Error).message}` };
  }

  const { data, error } = await admin
    .from("kol_codes")
    .insert({ instagram_handle, code, percent_off, amount_off_cents, stripe_coupon_id: couponId, stripe_promotion_code_id: promoId })
    .select("id")
    .single();
  if (error) {
    await stripe.promotionCodes.update(promoId, { active: false }).catch(() => {});
    return { error: error.message };
  }
  await audit(user.id, "kol_code.create", "kol_codes", data.id, { code, instagram_handle, percent_off, amount_off_cents });
  revalidatePath("/admin/kol");
  return { ok: true, nonce: Date.now() };
}

/** Edit the Instagram handle; turning a code off stops new uses (existing plan subscribers keep their discount). */
export async function updateKolCodeAction(_prev: KolFormState, formData: FormData): Promise<KolFormState> {
  const { user } = await requireAdmin();
  const parsed = kolUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fields: fieldErrors(parsed.error), error: "請檢查標示的欄位" };
  const { id, instagram_handle, is_active } = parsed.data;

  const admin = createAdminClient();
  const { data: current } = await admin.from("kol_codes").select("is_active, stripe_promotion_code_id").eq("id", id).maybeSingle();
  if (!current) return { error: "找不到此折扣碼" };
  if (current.is_active !== is_active) {
    try {
      await getStripe().promotionCodes.update(current.stripe_promotion_code_id, { active: is_active });
    } catch (err) {
      return { error: `Stripe：${(err as Error).message}` };
    }
  }

  const { error } = await admin.from("kol_codes").update({ instagram_handle, is_active }).eq("id", id);
  if (error) return { error: error.message };
  await audit(user.id, "kol_code.update", "kol_codes", id, { instagram_handle, is_active });
  revalidatePath("/admin/kol");
  return { ok: true };
}
