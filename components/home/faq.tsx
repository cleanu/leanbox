import { Plus } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { listOf } from "@/lib/i18n-shared";

export function Faq() {
  const t = useTranslations("home.faq");
  const items = listOf(useMessages().home.faq.items);
  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-lux grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-6 text-[clamp(2.2rem,4.6vw,3.6rem)]">{t("title")}</h2>
        </Reveal>
        <div className="divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
          {items.map((item) => (
            <details key={item.q} className="group py-2 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-xl transition-colors hover:text-olive-2 sm:text-2xl">
                {item.q}
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition-transform duration-500 ease-[var(--ease-lux)] group-open:rotate-45 group-open:bg-ink group-open:text-parchment">
                  <Plus className="size-4" aria-hidden />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-14 leading-relaxed text-walnut/80">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
