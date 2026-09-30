import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ToastProvider } from "@/components/ui/toast";
import { publicEnv } from "@/lib/env";
// Self-hosted fonts (no build-time call to Google Fonts). CJK faces are
// unicode-range sliced, so browsers only download the glyphs a page uses.
import "@fontsource-variable/montserrat/index.css";
import "@fontsource-variable/noto-sans-tc/index.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: t("title"), template: "%s｜LeanBox" },
    description: t("description"),
    icons: { icon: "/brand/mark.svg" },
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "LeanBox",
      locale: "zh_HK",
      type: "website",
      images: ["/food/hero.jpg"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#F5F1EA",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="grain">
        <NextIntlClientProvider>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
