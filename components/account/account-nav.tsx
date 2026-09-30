"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = [
    { href: "/account", label: t("account"), exact: true },
    { href: "/account/orders", label: t("orders") },
    { href: "/account/plan", label: t("myPlan") },
  ];
  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Account">
      {items.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm transition",
              active ? "bg-ink text-parchment" : "text-walnut hover:bg-parchment-2",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
