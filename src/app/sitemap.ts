import type { MetadataRoute } from "next";

const BASE = "https://construction-cost-engine.steep-tooth-c420.workers.dev";

const ROUTES = [
  "",
  "/wall-tile",
  "/column-beam",
  "/rebar",
  "/compare",
  "/compare-sources",
  "/stores",
  "/trend",
  "/sources",
  "/health",
  "/api-docs",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((p) => ({
    url: `${BASE}${p || "/"}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));
}
