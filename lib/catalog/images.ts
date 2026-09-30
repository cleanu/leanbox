import { publicEnv } from "@/lib/env";

export const MEAL_IMAGE_BUCKET = "meal-images";
export const MEAL_IMAGE_FALLBACK = "/food/placeholder.jpg";

/**
 * image_path can be:
 *  - "/food/x.jpg"      → a file in /public (asset slot)
 *  - "https://…"        → an absolute URL
 *  - "meals/x.webp"     → an object inside the meal-images Storage bucket
 */
export function mealImageUrl(path: string | null | undefined): string {
  if (!path) return MEAL_IMAGE_FALLBACK;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  if (!publicEnv.supabaseUrl) return MEAL_IMAGE_FALLBACK;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${MEAL_IMAGE_BUCKET}/${path.replace(/^\/+/, "")}`;
}
