import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  extractPricesFromHtml,
  fetchViaScrapingBee,
} from "@/lib/scrapers/_scrapingbee";
import { materialQuery } from "@/lib/scrapers/_headless";

const URL_TEMPLATES: Record<string, string> = {
  thaiwatsadu: "https://www.thaiwatsadu.com/th/search?keyword={q}",
  bnb: "https://www.bnbhome.com/search?q={q}",
  globalhouse: "https://www.globalhouse.co.th/search?q={q}",
  dohome: "https://www.dohome.co.th/c/search?q={q}",
  scghome: "https://www.scghome.com/search?keyword={q}",
};

export async function GET(req: Request) {
  const ctx = await getCloudflareContext({ async: true });
  const env = ctx?.env as CloudflareEnv | undefined;
  const reqToken =
    req.headers.get("x-admin-token") ??
    new URL(req.url).searchParams.get("token");
  if (env?.ADMIN_REFRESH_TOKEN && reqToken !== env.ADMIN_REFRESH_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const source = url.searchParams.get("source") ?? "dohome";
  const material = url.searchParams.get("material") ?? "CEMENT_001";
  const customUrl = url.searchParams.get("url");

  const target =
    customUrl ??
    (URL_TEMPLATES[source]
      ? URL_TEMPLATES[source].replace(
          "{q}",
          encodeURIComponent(materialQuery(material)),
        )
      : null);
  if (!target) {
    return NextResponse.json({ error: "no url for source" }, { status: 400 });
  }

  const html = await fetchViaScrapingBee({
    url: target,
    renderJs: true,
    countryCode: "th",
    waitMs: 2500,
    timeoutMs: 30_000,
  });

  if (html == null) {
    return NextResponse.json({
      source,
      material,
      target,
      ok: false,
      reason:
        "ScrapingBee fetch returned null (network error / non-2xx / no key)",
    });
  }

  const prices = extractPricesFromHtml(html);
  const sample = html.slice(0, 600);
  const hasPriceKeyword = /price/i.test(html);
  const hasItemprop = /itemprop\s*=\s*"price"/i.test(html);
  const hasJsonLdPrice = /"price"\s*:/i.test(html);
  const hasDataPrice = /data-price/i.test(html);
  const hasBaht = /฿/.test(html);

  return NextResponse.json({
    source,
    material,
    target,
    ok: true,
    htmlLength: html.length,
    sampleHead: sample,
    signals: {
      hasPriceKeyword,
      hasItemprop,
      hasJsonLdPrice,
      hasDataPrice,
      hasBaht,
    },
    pricesExtracted: prices,
    median:
      prices.length > 0
        ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
        : null,
  });
}
