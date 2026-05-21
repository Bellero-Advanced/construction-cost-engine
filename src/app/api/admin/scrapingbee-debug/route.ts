import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { extractPricesFromHtml } from "@/lib/scrapers/_scrapingbee";
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

  const apiKey = env?.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      source,
      material,
      target,
      ok: false,
      reason: "SCRAPINGBEE_API_KEY not bound to worker",
    });
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    url: target,
    render_js: "true",
    country_code: "th",
    wait: "2500",
  });

  let sbStatus: number | null = null;
  let sbBody: string | null = null;
  let sbError: string | null = null;
  const sbHeaders: Record<string, string> = {};
  try {
    const r = await fetch(
      `https://app.scrapingbee.com/api/v1/?${params.toString()}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    sbStatus = r.status;
    r.headers.forEach((v, k) => {
      if (
        k.toLowerCase().startsWith("spb-") ||
        k.toLowerCase() === "content-type"
      ) {
        sbHeaders[k] = v;
      }
    });
    sbBody = await r.text();
  } catch (e) {
    sbError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  const html = sbStatus && sbStatus >= 200 && sbStatus < 300 ? sbBody : null;
  if (html == null) {
    return NextResponse.json({
      source,
      material,
      target,
      ok: false,
      reason: "ScrapingBee non-2xx or fetch error",
      scrapingBee: {
        status: sbStatus,
        error: sbError,
        bodyPreview: sbBody?.slice(0, 500) ?? null,
        responseHeaders: sbHeaders,
      },
    });
  }

  const prices = extractPricesFromHtml(html);
  return NextResponse.json({
    source,
    material,
    target,
    ok: true,
    scrapingBee: { status: sbStatus, responseHeaders: sbHeaders },
    htmlLength: html.length,
    sampleHead: html.slice(0, 600),
    signals: {
      hasPriceKeyword: /price/i.test(html),
      hasItemprop: /itemprop\s*=\s*"price"/i.test(html),
      hasJsonLdPrice: /"price"\s*:/i.test(html),
      hasDataPrice: /data-price/i.test(html),
      hasBaht: /฿/.test(html),
    },
    pricesExtracted: prices,
    median:
      prices.length > 0
        ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
        : null,
  });
}
