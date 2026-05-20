import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, navKey: "wall_tile", path: "/wall-tile" });
}

export default function WallTileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
