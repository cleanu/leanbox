import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";
import { SetupScreen } from "@/components/setup/setup-screen";
import type { AuthErrorKey } from "@/lib/auth/errors";
import { getAuthProviders } from "@/lib/auth/providers";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured, safeNext } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

const ALLOWED_ERRORS: AuthErrorKey[] = ["oauthFailed", "callbackFailed"];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!isSupabaseConfigured()) return <SetupScreen compact />;
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/account");
  if (await getSessionUser()) redirect(next);

  const [t, providers] = await Promise.all([getTranslations("auth"), getAuthProviders()]);
  const error = typeof sp.error === "string" && ALLOWED_ERRORS.includes(sp.error as AuthErrorKey) ? (sp.error as AuthErrorKey) : undefined;

  return (
    <>
      <AuthHeading eyebrow={t("loginEyebrow")} title={t("loginTitle")} lede={t("loginLede")} />
      <LoginForm next={next} providers={providers} initialError={error} />
    </>
  );
}
