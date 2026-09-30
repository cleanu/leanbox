"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Provider = "apple" | "google";

/**
 * Official provider artwork goes in /public/brand/providers/{apple,google}.svg
 * (see the README there). Until then the buttons render text-only.
 */
function ProviderMark({ provider }: { provider: Provider }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // The image may finish loading before hydration, when onLoad isn't attached yet.
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset
    <img
      ref={ref}
      src={`/brand/providers/${provider}.svg`}
      alt=""
      aria-hidden
      width={provider === "apple" ? 16 : 18}
      height={18}
      className="shrink-0"
      style={loaded ? undefined : { display: "none" }}
      onLoad={() => setLoaded(true)}
    />
  );
}

export function OAuthButtons({
  providers,
  next,
  mode,
  onError,
}: {
  providers: { apple: boolean; google: boolean };
  next: string;
  mode: "login" | "signup";
  onError?: (message: string) => void;
}) {
  const t = useTranslations("auth");
  const [pending, setPending] = useState<Provider | null>(null);

  if (!providers.apple && !providers.google) return null;

  const start = async (provider: Provider) => {
    setPending(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setPending(null);
      onError?.(t("errors.oauthFailed"));
    }
    // On success the browser navigates to the provider.
  };

  const label = (p: Provider) =>
    p === "apple" ? (mode === "login" ? t("appleLogin") : t("appleContinue")) : mode === "login" ? t("googleLogin") : t("googleContinue");

  return (
    <div className="grid gap-3">
      {providers.apple ? (
        <button
          type="button"
          onClick={() => start("apple")}
          disabled={pending !== null}
          className={cn(
            // Apple HIG: black button, white logo + text, system font
            "flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-5 text-[0.95rem] font-medium text-white transition hover:bg-[#1d1d1f] disabled:opacity-60",
          )}
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang HK", system-ui, sans-serif' }}
        >
          <ProviderMark provider="apple" />
          {pending === "apple" ? t("submitting") : label("apple")}
        </button>
      ) : null}
      {providers.google ? (
        <button
          type="button"
          onClick={() => start("google")}
          disabled={pending !== null}
          className={cn(
            // Google branding (light): white fill, #747775 stroke, #1F1F1F text
            "flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-5 text-[0.95rem] font-medium text-[#1F1F1F] transition hover:bg-[#F8F8F8] disabled:opacity-60",
          )}
          style={{ fontFamily: 'Roboto, "Noto Sans TC", system-ui, sans-serif' }}
        >
          <ProviderMark provider="google" />
          {pending === "google" ? t("submitting") : label("google")}
        </button>
      ) : null}
    </div>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-mute">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
