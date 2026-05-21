import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://construction-cost-engine.steep-tooth-c420.workers.dev";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/admin/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
