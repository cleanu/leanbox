"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Package, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { initials } from "@/lib/utils";

export type HeaderUser = { name: string | null; email: string | null; avatarUrl: string | null; isAdmin: boolean };

export function UserMenu({ user }: { user: HeaderUser }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { href: "/account", label: t("account"), icon: User },
    { href: "/account/orders", label: t("orders"), icon: Package },
    { href: "/account/plan", label: t("myPlan"), icon: UtensilsCrossed },
    ...(user.isAdmin ? [{ href: "/admin", label: t("admin"), icon: LayoutDashboard }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("accountMenu")}
        className="grid size-10 place-items-center overflow-hidden rounded-full bg-walnut text-sm font-medium text-parchment ring-offset-2 ring-offset-parchment transition hover:ring-2 hover:ring-saffron"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- provider avatars come from arbitrary hosts
          <img src={user.avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="font-serif">{initials(user.name, user.email)}</span>
        )}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+0.6rem)] w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-parchment p-2 shadow-[0_24px_60px_-20px_rgba(22,19,16,0.4)]"
          >
            <div className="px-3 pb-3 pt-2">
              <p className="truncate font-serif text-base">{user.name || user.email}</p>
              {user.name && user.email ? <p className="truncate text-xs text-mute">{user.email}</p> : null}
            </div>
            <div className="border-t border-line pt-1.5">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-parchment-2"
                >
                  <Icon className="size-4 text-mute" strokeWidth={1.6} aria-hidden />
                  {label}
                </Link>
              ))}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-parchment-2"
                >
                  <LogOut className="size-4 text-mute" strokeWidth={1.6} aria-hidden />
                  {t("logout")}
                </button>
              </form>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
