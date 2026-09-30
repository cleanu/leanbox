import type { Tables } from "@/lib/supabase/database.types";

/** Columns anon/authenticated may read (see 003_rls.sql). Never includes cost_cents. */
export const PUBLIC_MEAL_COLUMNS =
  "id, slug, name_zh, name_en, description_zh, description_en, ingredients_zh, ingredients_en, allergens, kcal, protein_g, carbs_g, fat_g, tags, price_cents, image_path, is_active, weekly_stock, sort_order, created_at" as const;

export const PUBLIC_PLAN_COLUMNS =
  "id, slug, name_zh, name_en, description_zh, description_en, meals_per_week, price_cents, is_featured, is_active, sort_order" as const;

export type PublicMeal = Omit<Tables<"meals">, "cost_cents" | "updated_at">;
export type PublicPlan = Omit<Tables<"plans">, "cost_cents" | "stripe_price_id" | "created_at" | "updated_at">;

export type CatalogSource = "db" | "seed";
