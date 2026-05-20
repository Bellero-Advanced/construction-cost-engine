import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { locales, defaultLocale } from "@/i18n";

const SITE_URL =
  "https://construction-cost-engine.steep-tooth-c420.workers.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) {
    return {};
  }
  const tBrand = await getTranslations({ locale, namespace: "brand" });
  const tHome = await getTranslations({ locale, namespace: "home" });

  const description = tHome("description").replace(/<[^>]+>/g, "");
  const localePath = (l: string) => (l === defaultLocale ? "" : `/${l}`);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${tBrand("title")} — TPSO × CGD × Modern Trade`,
      template: `%s — ${tBrand("title")}`,
    },
    description,
    alternates: {
      canonical: localePath(locale) || "/",
      languages: Object.fromEntries(
        locales.map((l) => [l, localePath(l) || "/"]),
      ),
    },
    openGraph: {
      type: "website",
      url: localePath(locale) || "/",
      title: tBrand("title"),
      description,
      locale,
      siteName: tBrand("title"),
    },
    twitter: {
      card: "summary_large_image",
      title: tBrand("title"),
      description,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="mx-auto max-w-[1280px] px-7 py-8">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
