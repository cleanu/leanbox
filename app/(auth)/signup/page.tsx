import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthHeading } from "@/components/auth/auth-heading";
import { SignupForm } from "@/components/auth/signup-form";
import { SetupScreen } from "@/components/setup/setup-screen";
import { getAuthProviders } from "@/lib/auth/providers";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured, safeNext } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signupTitle") };
}

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  if (!isSupabaseConfigured()) return <SetupScreen compact />;
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/account");
  if (await getSessionUser()) redirect(next);
  const [t, providers] = await Promise.all([getTranslations("auth"), getAuthProviders()]);
  return (
    <>
      <AuthHeading eyebrow={t("signupEyebrow")} title={t("signupTitle")} lede={t("signupLede")} />
      <SignupForm next={next} providers={providers} />
    </>
  );
}
