import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotForm } from "@/components/auth/forgot-form";
import { SetupScreen } from "@/components/setup/setup-screen";
import { isSupabaseConfigured } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle") };
}

export default async function ForgotPasswordPage() {
  if (!isSupabaseConfigured()) return <SetupScreen compact />;
  const t = await getTranslations("auth");
  return (
    <>
      <AuthHeading title={t("forgotTitle")} lede={t("forgotLede")} />
      <ForgotForm />
    </>
  );
}
