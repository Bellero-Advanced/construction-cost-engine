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
    navKey: "health",
    path: "/health",
  });
}

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
