/** Meal tags are stored in Traditional Chinese (as in the DB seed). */
export const MEAL_TAGS = [
  { value: "高蛋白", en: "High protein" },
  { value: "均衡", en: "Balanced" },
  { value: "低碳", en: "Low carb" },
  { value: "增肌", en: "Muscle gain" },
  { value: "素", en: "Plant-based" },
] as const;

export function tagLabel(tag: string, locale: string): string {
  if (locale !== "en") return tag;
  return MEAL_TAGS.find((t) => t.value === tag)?.en ?? tag;
}
