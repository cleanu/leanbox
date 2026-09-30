import type { Metadata } from "next";
import Image from "next/image";
import { getMessages, getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/home/cta-band";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, SplitReveal } from "@/components/motion/reveal";
import { listOf } from "@/lib/i18n-shared";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("eyebrow"), description: t("intro") };
}

export default async function AboutPage() {
  const [t, messages] = await Promise.all([getTranslations("about"), getMessages()]);
  const principles = listOf(messages.about.principles);
  return (
    <>
      <div className="container-lux pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+5rem)]">
        <header className="max-w-4xl pb-20">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="display mt-6 text-[clamp(2.6rem,6.5vw,6rem)]">
            <SplitReveal text={t("title")} stagger={0.03} />
          </h1>
          <Reveal delay={0.35} trigger="mount">
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-walnut/85">{t("intro")}</p>
          </Reveal>
        </header>

        <section className="grid items-center gap-14 border-t border-line py-24 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Parallax className="mask-arch relative aspect-[4/5] bg-parchment-3" amount={10}>
              <div className="absolute inset-0">
                <Image src="/about/founder.jpg" alt={t("founderName")} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              </div>
            </Parallax>
          </div>
          <Reveal className="lg:col-span-6 lg:col-start-7">
            <p className="eyebrow">{t("founderTitle")}</p>
            <blockquote className="mt-8 font-serif text-[clamp(1.5rem,2.6vw,2.2rem)] leading-snug">{t("founderBody")}</blockquote>
            <p className="mt-8 flex items-center gap-4 text-sm text-mute">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              {t("founderName")}
            </p>
          </Reveal>
        </section>

        <section className="border-t border-line py-24">
          <Reveal>
            <p className="eyebrow">{t("principlesTitle")}</p>
          </Reveal>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <span className="numeral text-5xl text-saffron">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-5 text-2xl">{p.title}</h2>
                <p className="mt-3 leading-relaxed text-walnut/80">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-t border-line py-24 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">{t("kitchenTitle")}</p>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6" delay={0.1}>
            <p className="font-serif text-[clamp(1.4rem,2.4vw,2rem)] leading-snug">{t("kitchenBody")}</p>
          </Reveal>
        </section>
      </div>
      <CtaBand />
    </>
  );
}
