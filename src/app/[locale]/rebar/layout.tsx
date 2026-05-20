import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, navKey: "rebar", path: "/rebar" });
}

export default function RebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
