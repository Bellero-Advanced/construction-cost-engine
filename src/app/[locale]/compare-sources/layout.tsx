import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    navKey: "compare_sources",
    path: "/compare-sources",
  });
}

export default function CompareSourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
