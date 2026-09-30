import { ArrowUpRight, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { EmailForm } from "@/components/account/email-form";
import { Identities } from "@/components/account/identities";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ProfileForm } from "@/components/account/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { getAuthProviders } from "@/lib/auth/providers";
import { getProfile, requireUser } from "@/lib/auth/session";
import { districtLabel } from "@/lib/districts";
import { formatHKD } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { orderRef } from "@/lib/utils";
import { currentWeekId, formatHKT, formatWeekId } from "@/lib/weeks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("eyebrow"), robots: { index: false } };
}

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const [t, tn, locale, profile, providers, sp] = await Promise.all([
    getTranslations("account"),
    getTranslations("orders"),
    getLocale(),
    getProfile(),
    getAuthProviders(),
    searchParams,
  ]);
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, fulfillment_week, total_cents, created_at, kind, delivery_district, delivery_address")
    .order("created_at", { ascending: false })
    .limit(20);

  const thisWeek = currentWeekId();
  const upcoming = (orders ?? [])
    .filter((o) => ["paid", "preparing", "out_for_delivery"].includes(o.status) && o.fulfillment_week >= thisWeek)
    .sort((a, b) => a.fulfillment_week.localeCompare(b.fulfillment_week))[0];

  const name = profile?.full_name || (user.user_metadata?.full_name as string | undefined);
  const identities = (user.identities ?? []).map((i) => i.provider);
  const email = user.email ?? null;
  const isRelay = Boolean(email?.endsWith("@privaterelay.appleid.com"));

  return (
    <div className="grid gap-16 lg:grid-cols-12">
      <div className="space-y-14 lg:col-span-7">
        <header>
          <h1 className="text-[clamp(2.2rem,4.5vw,3.6rem)]">{name ? t("greeting", { name }) : t("greetingFallback")}</h1>
          {email ? <p className="mt-2 text-sm text-mute">{email}</p> : null}
          {sp.password === "updated" ? (
            <div className="mt-6">
              <FormAlert tone="success">{t("saved")}</FormAlert>
            </div>
          ) : null}
        </header>

        <section className="rounded-[1.5rem] bg-walnut p-8 text-parchment sm:p-10">
          <p className="eyebrow flex items-center gap-2 !text-mute-on-dark">
            <Truck className="size-4" aria-hidden /> {t("nextDelivery")}
          </p>
          {upcoming ? (
            <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-serif text-3xl">{formatWeekId(upcoming.fulfillment_week, locale)}</p>
                <p className="mt-2 text-sm text-mute-on-dark">
                  {districtLabel(upcoming.delivery_district, locale)} · {upcoming.delivery_address}
                </p>
              </div>
              <ButtonLink href={`/account/orders/${upcoming.id}`} variant="light" size="sm">
                {tn("viewOrder")}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-6">
              <p className="font-serif text-2xl">{t("nextDeliveryNone")}</p>
              <ButtonLink href="/menu" variant="light" size="sm">
                {t("nextDeliveryCta")}
              </ButtonLink>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl">{t("profileTitle")}</h2>
          <p className="mt-1 text-sm text-mute">{t("profileLede")}</p>
          <div className="mt-8">
            <ProfileForm
              showContactEmail={!email || isRelay}
              defaults={{
                full_name: profile?.full_name ?? "",
                phone: profile?.phone ?? "",
                district: profile?.district ?? "",
                address_line: profile?.address_line ?? "",
                notes: profile?.notes ?? "",
                contact_email: profile?.contact_email ?? "",
              }}
            />
          </div>
        </section>
      </div>

      <aside className="space-y-12 lg:col-span-4 lg:col-start-9">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl">{t("recentOrders")}</h2>
            <Link href="/account/orders" className="link-underline inline-flex items-center gap-1 text-xs">
              {t("ordersCta")} <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {(orders ?? []).slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 py-4 transition hover:opacity-70">
                  <div>
                    <p className="numeral text-sm">{orderRef(o.order_number)}</p>
                    <p className="text-xs text-mute">{formatHKT(o.created_at, locale, { dateStyle: "medium" })}</p>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={o.status} />
                    <p className="numeral mt-1 text-sm">{formatHKD(o.total_cents)}</p>
                  </div>
                </Link>
              </li>
            ))}
            {!orders?.length ? <li className="py-6 text-sm text-mute">{tn("empty")}</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-xl">{t("identitiesTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-mute">{t("identitiesLede")}</p>
          <div className="mt-5">
            <Identities linked={identities} available={providers} />
          </div>
        </section>

        {!email || isRelay ? (
          <section>
            <h2 className="text-xl">{t("emailTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-mute">{email ? t("emailRelay") : t("emailMissing")}</p>
            <div className="mt-5">
              <EmailForm current={isRelay ? null : email} />
            </div>
          </section>
        ) : null}

        <form action="/auth/signout" method="post">
          <button type="submit" className="link-underline text-sm text-mute hover:text-ink">
            {t("signOut")}
          </button>
        </form>
      </aside>
    </div>
  );
}
