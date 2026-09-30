"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, planFormSchema } from "@/lib/validation";

export type PlanFormState = { ok?: boolean; error?: string; fields?: Record<string, string> };

export async function savePlanAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const { user } = await requireAdmin();
  const parsed = planFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fields: fieldErrors(parsed.error), error: "請檢查標示的欄位" };
  const { id, price, cost, ...rest } = parsed.data;
  const { error } = await createAdminClient()
    .from("plans")
    .update({ ...rest, price_cents: price, cost_cents: cost })
    .eq("id", id);
  if (error) return { error: error.message };
  await audit(user.id, "plan.update", "plans", id, { price_cents: price, cost_cents: cost, stripe_price_id: rest.stripe_price_id });
  revalidatePath("/admin/plans");
  revalidatePath("/plans");
  revalidatePath("/");
  return { ok: true };
}
