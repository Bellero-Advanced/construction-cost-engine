import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, navKey: "trend", path: "/trend" });
}

export default function TrendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
