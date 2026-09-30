import type { Locale } from "@/lib/i18n-shared";
import en from "./en";
import zhHK, { type Messages } from "./zh-HK";

export const messages: Record<Locale, Messages> = { "zh-HK": zhHK, en };
export type { Messages };
