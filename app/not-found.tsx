import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="container-lux flex min-h-dvh flex-col py-10">
      <Link href="/" aria-label="LeanBox">
        <Logo />
      </Link>
      <div className="flex flex-1 flex-col items-start justify-center">
        <p className="numeral text-[clamp(6rem,18vw,14rem)] leading-none text-saffron">404</p>
        <h1 className="mt-6 text-4xl">{t("title")}</h1>
        <p className="mt-3 text-mute">{t("body")}</p>
        <ButtonLink href="/" className="mt-10">
          {t("cta")}
        </ButtonLink>
      </div>
    </div>
  );
}
