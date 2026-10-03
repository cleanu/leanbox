"use client";

import { BarChart3, ExternalLink, LayoutDashboard, Megaphone, Package, Soup, Tags, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "總覽", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "訂單", icon: Package },
  { href: "/admin/meals", label: "餐點", icon: Soup },
  { href: "/admin/plans", label: "計劃", icon: Tags },
  { href: "/admin/customers", label: "客戶", icon: Users },
  { href: "/admin/kol", label: "KOL", icon: Megaphone },
  { href: "/admin/finance", label: "財務", icon: BarChart3 },
];

export function AdminSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col bg-walnut text-parchment lg:sticky lg:top-0 lg:h-dvh">
      <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoMark className="h-7" />
          <span className="font-serif text-lg">
            LeanBox <span className="text-xs tracking-[0.2em] text-mute-on-dark">ADMIN</span>
          </span>
        </Link>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-parchment text-ink" : "text-parchment/80 hover:bg-walnut-2 hover:text-parchment",
              )}
            >
              <Icon className="size-4" strokeWidth={1.7} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-line-dark px-5 py-5 text-xs text-mute-on-dark lg:block">
        <p className="truncate">{email}</p>
        <Link href="/" className="mt-3 inline-flex items-center gap-1.5 text-parchment/80 hover:text-parchment">
          返回網站 <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
