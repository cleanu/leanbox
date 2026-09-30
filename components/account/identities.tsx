"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormAlert } from "@/components/ui/form";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type Provider = "email" | "google" | "apple";

/**
 * Lists linked sign-in methods. Supabase links identities with the same
 * verified email automatically; "Link" uses manual identity linking, which
 * must be enabled in Supabase (Auth → Settings → Allow manual linking).
 */
export function Identities({ linked, available }: { linked: string[]; available: { google: boolean; apple: boolean } }) {
  const t = useTranslations("account");
  const [error, setError] = useState<string | null>(null);
  const providers: Provider[] = ["email", ...(available.google ? (["google"] as const) : []), ...(available.apple ? (["apple"] as const) : [])];

  const link = async (provider: "google" | "apple") => {
    setError(null);
    const { error: err } = await createClient().auth.linkIdentity({
      provider,
      options: { redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/account` },
    });
    if (err) setError(t("linkUnavailable"));
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white/40">
        {providers.map((p) => {
          const isLinked = linked.includes(p);
          return (
            <li key={p} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium">{t(`providers.${p}`)}</span>
              {isLinked ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-olive">
                  <Check className="size-3.5" aria-hidden />
                  {t("linked")}
                </span>
              ) : p === "email" ? (
                <span className="text-xs text-mute">—</span>
              ) : (
                <button type="button" onClick={() => link(p)} className="link-underline text-xs font-medium">
                  {t("link")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error ? <FormAlert>{error}</FormAlert> : null}
    </div>
  );
}
