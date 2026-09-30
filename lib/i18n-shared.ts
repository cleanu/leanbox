export const locales = ["zh-HK", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-HK";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Pick the zh / en variant of a bilingual DB field. */
export function pick<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: Locale,
): string {
  const zh = row[`${field}_zh`];
  const en = row[`${field}_en`];
  const primary = locale === "en" ? en : zh;
  const secondary = locale === "en" ? zh : en;
  return String(primary || secondary || "");
}

/** Messages store lists as { "1": …, "2": … } objects; turn one back into an array. */
export function listOf<T>(obj: Record<string, T> | null | undefined): T[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => obj[k]);
}
