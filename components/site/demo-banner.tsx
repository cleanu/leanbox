"use client";

import { FlaskConical, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const KEY = "leanbox.demo-banner.dismissed";

/** Small floating notice shown while Supabase isn't configured. */
export function DemoBanner() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(KEY) === "1";
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read sessionStorage after mount
    setOpen(!dismissed);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[65] max-w-[calc(100vw-2rem)] sm:max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-saffron/40 bg-saffron-soft/95 py-3 pl-4 pr-2 text-xs leading-relaxed text-walnut shadow-[0_12px_40px_-16px_rgba(22,19,16,0.4)] backdrop-blur">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-saffron" aria-hidden />
        <p className="flex-1">
          {t("demoMode")}{" "}
          <Link href="/setup" className="font-medium underline underline-offset-4">
            {t("demoModeCta")}
          </Link>
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            try {
              window.sessionStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
          }}
          className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-saffron/20"
          aria-label={t("close")}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
