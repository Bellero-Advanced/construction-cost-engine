import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n";

const SITE_URL =
  "https://construction-cost-engine.steep-tooth-c420.workers.dev";

export interface PageMetaInput {
  locale: string;
  navKey: string; // matches `nav.<key>` in messages
  path: string; // route path WITHOUT locale prefix, e.g. "/wall-tile"
  description?: string; // optional override
}

export async function buildPageMetadata({
  locale,
  navKey,
  path,
  description,
}: PageMetaInput): Promise<Metadata> {
  if (!(locales as readonly string[]).includes(locale)) return {};

  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  const tBrand = await getTranslations({ locale, namespace: "brand" });

  const title = tNav(navKey);
  const desc = description ?? tHome("description").replace(/<[^>]+>/g, "");

  const localePath = (l: string) => (l === defaultLocale ? "" : `/${l}`);
  const canonicalPath = `${localePath(locale)}${path}`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: canonicalPath || "/",
      languages: Object.fromEntries(
        locales.map((l) => [l, `${localePath(l)}${path}` || "/"]),
      ),
    },
    openGraph: {
      type: "website",
      title: `${title} — ${tBrand("title")}`,
      description: desc,
      url: canonicalPath || "/",
      locale,
      siteName: tBrand("title"),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${tBrand("title")}`,
      description: desc,
    },
    metadataBase: new URL(SITE_URL),
  };
}
