import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckoutForm, CheckoutLoginWall } from "@/components/checkout/checkout-form";
import { SetupScreen } from "@/components/setup/setup-screen";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { getActivePlans } from "@/lib/catalog/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { isServiceRoleConfigured, isStripeConfigured } from "@/lib/env.server";
import { cutoffLabel, openDeliveryWeeks } from "@/lib/weeks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("eyebrow"), robots: { index: false } };
}

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const t = await getTranslations("checkout");
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-lux pt-[var(--header-h)]">
        <div className="mx-auto max-w-2xl">
          <SetupScreen compact />
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const planId = typeof sp.plan === "string" ? sp.plan : null;
  const [user, { plans }, locale] = await Promise.all([getSessionUser(), getActivePlans(), getLocale()]);
  const plan = planId ? (plans.find((p) => p.id === planId) ?? null) : null;
  const next = plan ? `/checkout?plan=${plan.id}` : "/checkout";

  let body: React.ReactNode;
  if (!user) {
    body = <CheckoutLoginWall plan={plan} next={next} />;
  } else {
    const profile = await getProfile();
    const phone = (profile?.phone ?? "").replace(/^\+852\s?/, "");
    body = (
      <CheckoutForm
        plan={plan}
        weeks={openDeliveryWeeks(new Date(), 2)}
        stripeReady={isStripeConfigured() && isServiceRoleConfigured()}
        defaults={{
          name: profile?.full_name ?? "",
          phone,
          district: profile?.district ?? "",
          address: profile?.address_line ?? "",
          notes: profile?.notes ?? "",
        }}
      />
    );
  }

  return (
    <div className="container-lux pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+4rem)]">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-4 text-[clamp(2.2rem,4.5vw,3.6rem)]">{t("title")}</h1>
        </div>
        <p className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs tracking-wide text-walnut">
          <span className="size-1.5 rounded-full bg-saffron" />
          {t("cutoff", { time: cutoffLabel(locale) })}
        </p>
      </header>
      {body}
    </div>
  );
}
