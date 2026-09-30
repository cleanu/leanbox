import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SEED_MEALS, SEED_PLANS } from "./seed-data";
import { PUBLIC_MEAL_COLUMNS, PUBLIC_PLAN_COLUMNS, type CatalogSource, type PublicMeal, type PublicPlan } from "./types";

/** Active meals for the public site. Falls back to the seed catalog in demo mode. */
export const getActiveMeals = cache(async (): Promise<{ meals: PublicMeal[]; source: CatalogSource }> => {
  if (!isSupabaseConfigured()) return { meals: SEED_MEALS, source: "seed" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select(PUBLIC_MEAL_COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[catalog] meals query failed — did you run the migrations?", error.message);
    return { meals: [], source: "db" };
  }
  return { meals: data ?? [], source: "db" };
});

export const getActivePlans = cache(async (): Promise<{ plans: PublicPlan[]; source: CatalogSource }> => {
  if (!isSupabaseConfigured()) return { plans: SEED_PLANS, source: "seed" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select(PUBLIC_PLAN_COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[catalog] plans query failed — did you run the migrations?", error.message);
    return { plans: [], source: "db" };
  }
  return { plans: data ?? [], source: "db" };
});

export function catalogStats(meals: PublicMeal[]) {
  const n = meals.length || 1;
  const avg = (k: "protein_g" | "kcal") => Math.round(meals.reduce((s, m) => s + m[k], 0) / n);
  return { avgProtein: avg("protein_g"), avgKcal: avg("kcal"), count: meals.length };
}
