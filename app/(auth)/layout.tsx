import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleToggle } from "@/components/site/locale-toggle";
import { Logo } from "@/components/ui/logo";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("common");
  const home = await getTranslations("home.hero");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-walnut text-parchment lg:block">
        <Image src="/food/hero.jpg" alt="" fill priority sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-walnut via-walnut/40 to-walnut/10" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="LeanBox">
            <Logo tone="parchment" />
          </Link>
          <div>
            <p className="eyebrow !text-parchment/70">{home("eyebrow")}</p>
            <p className="display mt-5 max-w-lg text-6xl">
              {home("title1")}
              <br />
              <span className="italic text-saffron-2">{home("title2")}</span>
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-parchment/75">{t("taglineAlt")}</p>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <div className="container-lux flex h-[var(--header-h)] items-center justify-between lg:justify-end">
          <Link href="/" aria-label="LeanBox" className="lg:hidden">
            <Logo />
          </Link>
          <LocaleToggle />
        </div>
        <main id="main" className="flex flex-1 items-center">
          <div className="container-lux py-10">
            <div className="mx-auto w-full max-w-[26rem]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
