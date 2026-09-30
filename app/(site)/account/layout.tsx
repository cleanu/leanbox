import { getTranslations } from "next-intl/server";
import { AccountNav } from "@/components/account/account-nav";
import { SetupScreen } from "@/components/setup/setup-screen";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-lux pt-[var(--header-h)]">
        <div className="mx-auto max-w-2xl">
          <SetupScreen compact />
        </div>
      </div>
    );
  }
  await requireUser("/account");
  const t = await getTranslations("account");
  return (
    <div className="container-lux pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+4rem)]">
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <AccountNav />
      </div>
      {children}
    </div>
  );
}
