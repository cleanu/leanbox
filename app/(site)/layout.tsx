import { getTranslations } from "next-intl/server";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { DemoBanner } from "@/components/site/demo-banner";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { readCartLines } from "@/lib/cart/server";
import { getActiveMeals } from "@/lib/catalog/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("common");
  const [user, { meals }] = await Promise.all([getSessionUser(), getActiveMeals()]);
  const [profile, initialLines] = user
    ? await Promise.all([getProfile(), createClient().then((sb) => readCartLines(sb, user.id))])
    : [null, []];

  const headerUser = user
    ? {
        name: profile?.full_name || (user.user_metadata?.full_name as string | undefined) || null,
        email: user.email ?? profile?.contact_email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        isAdmin: profile?.role === "admin",
      }
    : null;

  return (
    <CartProvider userId={user?.id ?? null} initialLines={initialLines} meals={meals}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-parchment"
      >
        {t("skipToContent")}
      </a>
      <SmoothScroll />
      <Header user={headerUser} />
      <main id="main" className="min-h-[70vh]">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      {isSupabaseConfigured() ? null : <DemoBanner />}
    </CartProvider>
  );
}
