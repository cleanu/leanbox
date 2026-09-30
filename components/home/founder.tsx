import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";

export function Founder() {
  const t = useTranslations("home.founder");
  return (
    <section className="py-24 sm:py-32">
      <div className="container-lux grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Parallax className="mask-arch relative aspect-[4/5] bg-parchment-3" amount={10}>
            <div className="absolute inset-0">
              <Image src="/about/founder.jpg" alt={t("signature")} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </Parallax>
        </div>
        <Reveal className="lg:col-span-6 lg:col-start-7">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-6 text-[clamp(2rem,4vw,3.4rem)]">{t("title")}</h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-walnut/85">{t("body")}</p>
          <div className="mt-10 flex items-center gap-6">
            <span className="h-px w-12 bg-saffron" aria-hidden />
            <span className="font-serif italic text-walnut">{t("signature")}</span>
          </div>
          <Link href="/about" className="link-underline group mt-10 inline-flex items-center gap-2 pb-1 text-sm">
            {t("cta")}
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
