import type { Locale } from "@/lib/i18n-shared";
import type { Messages } from "@/messages/zh-HK";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
