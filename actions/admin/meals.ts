"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/session";
import { MEAL_IMAGE_BUCKET } from "@/lib/catalog/images";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, mealFormSchema } from "@/lib/validation";

export type MealFormState = { error?: string; fields?: Record<string, string>; ok?: boolean };

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

function revalidateCatalog() {
  revalidatePath("/admin/meals");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function saveMealAction(_prev: MealFormState, formData: FormData): Promise<MealFormState> {
  const { user } = await requireAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = mealFormSchema.safeParse({ ...raw, tags: formData.getAll("tags") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), error: "請檢查標示的欄位" };
  const { id, price, cost, image_path, ...rest } = parsed.data;

  const admin = createAdminClient();
  let imagePath = image_path ?? null;

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { fields: { image: "只接受 JPG / PNG / WebP / AVIF" } };
    if (file.size > 5 * 1024 * 1024) return { fields: { image: "圖片不可大於 5MB" } };
    const path = `meals/${rest.slug}-${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage.from(MEAL_IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: `上載圖片失敗：${uploadError.message}` };
    imagePath = path;
  }

  const row = { ...rest, price_cents: price, cost_cents: cost, image_path: imagePath };
  if (id) {
    const { error } = await admin.from("meals").update(row).eq("id", id);
    if (error) return { error: error.code === "23505" ? "Slug 已被使用" : error.message };
    await audit(user.id, "meal.update", "meals", id, { slug: rest.slug, price_cents: price, cost_cents: cost, weekly_stock: rest.weekly_stock, is_active: rest.is_active });
    revalidateCatalog();
    revalidatePath(`/admin/meals/${id}`);
    return { ok: true };
  }

  const { data, error } = await admin.from("meals").insert(row).select("id").single();
  if (error) return { error: error.code === "23505" ? "Slug 已被使用" : error.message };
  await audit(user.id, "meal.create", "meals", data.id, { slug: rest.slug });
  revalidateCatalog();
  redirect(`/admin/meals/${data.id}?created=1`);
}

export async function toggleMealActiveAction(formData: FormData) {
  const { user } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await createAdminClient().from("meals").update({ is_active: active }).eq("id", id);
  await audit(user.id, active ? "meal.activate" : "meal.deactivate", "meals", id);
  revalidateCatalog();
}

export async function resetWeeklyStockAction(formData: FormData) {
  const { user } = await requireAdmin();
  const stock = z.coerce.number().int().min(0).max(10_000).parse(formData.get("stock"));
  const admin = createAdminClient();
  const { data } = await admin.from("meals").update({ weekly_stock: stock }).eq("is_active", true).select("id");
  await audit(user.id, "meal.reset_stock", "meals", null, { stock, count: data?.length ?? 0 });
  revalidateCatalog();
}

export async function deleteMealAction(_prev: MealFormState, formData: FormData): Promise<MealFormState> {
  const { user } = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "資料不正確" };
  if (formData.get("confirm") !== "on") return { error: "請先勾選確認刪除" };
  const admin = createAdminClient();
  const { data: meal } = await admin.from("meals").select("slug").eq("id", id.data).maybeSingle();
  // Past order_items keep their name/price snapshot (meal_id is set null).
  const { error } = await admin.from("meals").delete().eq("id", id.data);
  if (error) return { error: error.message };
  await audit(user.id, "meal.delete", "meals", id.data, { slug: meal?.slug ?? null });
  revalidateCatalog();
  redirect("/admin/meals?deleted=1");
}
