import { CheckCircle2, CircleDashed, Terminal } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { envChecks } from "@/lib/env.server";
import { cn } from "@/lib/utils";

/**
 * Styled "finish setup" screen shown instead of crashing when keys are missing.
 * Lists which env vars are present (never their values).
 */
export async function SetupScreen({ focus = "supabase", compact = false }: { focus?: "supabase" | "stripe"; compact?: boolean }) {
  const t = await getTranslations("setup");
  const checks = envChecks();
  const relevant = focus === "stripe" ? checks.filter((c) => c.key.includes("STRIPE")) : checks;

  return (
    <div className={cn(compact ? "py-6" : "container-lux min-h-dvh py-16 sm:py-24")}>
      <div className="mx-auto max-w-2xl">
        {compact ? null : (
          <Link href="/" aria-label="LeanBox">
            <Logo />
          </Link>
        )}
        <p className={cn("eyebrow", compact ? "" : "mt-14")}>Setup · 設定</p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)]">{focus === "stripe" ? t("stripeTitle") : t("title")}</h1>
        <p className="mt-4 leading-relaxed text-walnut/80">{t("lede")}</p>

        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white/40">
          {relevant.map((c) => (
            <li key={c.key} className="flex items-start gap-4 px-5 py-4">
              {c.ok ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-olive" aria-label="set" />
              ) : (
                <CircleDashed className="mt-0.5 size-5 shrink-0 text-saffron" aria-label="missing" />
              )}
              <div className="min-w-0">
                <code className="break-all font-mono text-[0.8rem] font-medium">{c.key}</code>
                <span className={cn("ml-2 inline-block rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-wider", c.scope === "server" ? "bg-walnut text-parchment" : "bg-parchment-3 text-walnut")}>
                  {c.scope}
                </span>
                <p className="mt-1 text-xs text-mute">{c.hint}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl bg-ink p-6 font-mono text-[0.8rem] leading-relaxed text-parchment/90">
          <p className="mb-3 flex items-center gap-2 text-parchment/60">
            <Terminal className="size-4" aria-hidden /> Terminal
          </p>
          <p>cp .env.example .env.local</p>
          <p className="text-parchment/50"># fill in the values above, then</p>
          <p>npm run dev</p>
        </div>

        <p className="mt-8 text-sm text-mute">{t("readme")}</p>
        {compact ? null : (
          <ButtonLink href="/" variant="outline" className="mt-8">
            {t("back")}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
