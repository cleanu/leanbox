import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/logo";
import { shopConfig } from "@/lib/config";
import { cutoffLabel } from "@/lib/weeks";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const common = await getTranslations("common");
  const locale = await getLocale();

  return (
    <footer className="relative mt-32 overflow-hidden bg-walnut text-parchment">
      <div className="container-lux grid gap-14 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo tone="parchment" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-mute-on-dark">{t("tagline")}</p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line-dark px-4 py-2 text-xs tracking-wide text-parchment/90">
            <span className="size-1.5 rounded-full bg-sage" />
            {t("cutoff", { time: cutoffLabel(locale) })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
          <div>
            <p className="eyebrow !text-mute-on-dark">{t("explore")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link className="link-underline" href="/menu">{nav("menu")}</Link></li>
              <li><Link className="link-underline" href="/plans">{nav("plans")}</Link></li>
              <li><Link className="link-underline" href="/about">{nav("about")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-mute-on-dark">{t("help")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link className="link-underline" href="/#faq">{t("faq")}</Link></li>
              <li><Link className="link-underline" href="/#how">{nav("howItWorks")}</Link></li>
              <li><Link className="link-underline" href="/account/orders">{nav("orders")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-mute-on-dark">{t("contact")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a className="link-underline inline-flex items-center gap-2" href={shopConfig.contact.whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" aria-hidden /> {t("whatsapp")}
                </a>
              </li>
              <li>
                <a className="link-underline inline-flex items-center gap-2" href={shopConfig.contact.phoneHref}>
                  <Phone className="size-4" aria-hidden /> {shopConfig.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a className="link-underline" href={`mailto:${shopConfig.contact.email}`}>{shopConfig.contact.email}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container-lux overflow-hidden">
        {/* Faint wordmark; letters wash to sage in a wave on hover. (A stroked outline would expose the variable font's overlapping contours.) */}
        <p aria-hidden className="group display flex select-none justify-center whitespace-nowrap pb-4 text-[16vw] leading-[0.85] md:text-[13vw]">
          {Array.from("LEANBOX").map((ch, i) => (
            <span
              key={i}
              className="text-cream/[0.07] transition-[color,transform] duration-500 ease-[var(--ease-lux)] group-hover:-translate-y-[0.04em] group-hover:text-sage"
              style={{ transitionDelay: `${i * 45}ms` }}
            >
              {ch}
            </span>
          ))}
        </p>
      </div>
      <div className="border-t border-line-dark">
        <div className="container-lux flex flex-col gap-2 py-6 text-xs text-mute-on-dark sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <p>{common("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
