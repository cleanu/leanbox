import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n-shared";
import { messages } from "@/messages";

// No locale in the URL: the header toggle stores the choice in a cookie.
export default getRequestConfig(async () => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value) ? value : defaultLocale;
  return {
    locale,
    messages: messages[locale],
    timeZone: "Asia/Hong_Kong",
  };
});
