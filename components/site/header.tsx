"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CartButton } from "@/components/cart/cart-button";
import { Magnetic } from "@/components/motion/magnetic";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { LocaleToggle } from "./locale-toggle";
import { UserMenu, type HeaderUser } from "./user-menu";

export function Header({ user }: { user: HeaderUser | null }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { scrollY, scrollYProgress } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // The home page opens on a dark cinematic scene; keep the bar light-on-dark until it turns glassy.
  const onDark = pathname === "/" && !scrolled && !mobileOpen;

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 80);
    setHidden(y > 240 && y > prev + 4 && !mobileOpen);
    if (y < prev - 4) setHidden(false);
  });

  useEffect(() => {
    if (!mobileOpen) return;
    window.dispatchEvent(new Event("lenis:stop"));
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      window.dispatchEvent(new Event("lenis:start"));
    };
  }, [mobileOpen]);

  const links = [
    { href: "/menu", label: t("menu") },
    { href: "/plans", label: t("plans") },
    { href: "/#how", label: t("howItWorks") },
    { href: "/about", label: t("about") },
  ];

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-sage"
        style={{ scaleX: scrollYProgress }}
      />
      <motion.header
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,color] duration-500",
          scrolled || mobileOpen ? "border-b border-line bg-cream/80 text-ink backdrop-blur-md" : "border-b border-transparent",
          onDark && "text-cream",
        )}
      >
        <div className="container-lux flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" className="shrink-0" aria-label="LeanBox" onClick={() => setMobileOpen(false)}>
            <Logo tone={onDark ? "parchment" : "ink"} />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {links.map((l) => {
              const active = l.href !== "/#how" && pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "link-underline relative text-[0.9rem] font-medium tracking-wide transition-colors",
                    onDark ? (active ? "text-cream" : "text-cream/75 hover:text-cream") : active ? "text-ink" : "text-ink/70 hover:text-ink",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                  {active ? <span aria-hidden className="absolute -bottom-2.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-sage" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LocaleToggle className="hidden sm:inline-flex" tone={onDark ? "light" : "ink"} />
            <CartButton className={onDark ? "hover:bg-cream/10" : undefined} />
            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link href="/login" className={cn("rounded-full px-4 py-2 text-sm transition", onDark ? "hover:bg-cream/10" : "hover:bg-parchment-2")}>
                  {t("login")}
                </Link>
                <Magnetic strength={0.2}>
                  <ButtonLink href="/plans" size="sm" className="h-10 px-5">
                    {t("startPlan")}
                  </ButtonLink>
                </Magnetic>
              </div>
            )}
            <button
              type="button"
              className={cn("grid size-11 place-items-center rounded-full transition lg:hidden", onDark ? "hover:bg-cream/10" : "hover:bg-parchment-2")}
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            >
              {mobileOpen ? <X className="size-5" aria-hidden /> : <MenuIcon className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="mobile-nav"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-parchment pt-[var(--header-h)] lg:hidden"
          >
            <nav className="container-lux flex flex-1 flex-col justify-center gap-2" aria-label="Mobile">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={l.href} onClick={() => setMobileOpen(false)} className="block py-2 font-serif text-4xl font-extrabold">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="container-lux flex items-center justify-between gap-3 border-t border-line py-6">
              <LocaleToggle />
              {user ? null : (
                <div className="flex gap-2">
                  <ButtonLink href="/login" variant="outline" size="sm" onClick={() => setMobileOpen(false)}>
                    {t("login")}
                  </ButtonLink>
                  <ButtonLink href="/plans" size="sm" onClick={() => setMobileOpen(false)}>
                    {t("startPlan")}
                  </ButtonLink>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
