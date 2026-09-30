import { LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetForm } from "@/components/auth/reset-form";
import { SetupScreen } from "@/components/setup/setup-screen";
import { ButtonLink } from "@/components/ui/button";
import { RECOVERY_COOKIE } from "@/lib/auth/recovery";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle"), robots: { index: false } };
}

/** Only usable with a recovery session created by /auth/callback. */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  if (!isSupabaseConfigured()) return <SetupScreen compact />;
  const t = await getTranslations("auth");
  const sp = await searchParams;
  const store = await cookies();
  const hasRecovery = Boolean(store.get(RECOVERY_COOKIE)) && Boolean(await getSessionUser());

  if (sp.error || !hasRecovery) {
    return (
      <div className="space-y-6">
        <div className="grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
          <LinkIcon className="size-6" aria-hidden />
        </div>
        <AuthHeading title={t("linkExpiredTitle")} lede={t("linkExpiredBody")} />
        <ButtonLink href="/forgot-password" size="lg" className="w-full">
          {t("backToForgot")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title={t("resetTitle")} lede={t("resetLede")} />
      <ResetForm />
    </>
  );
}
