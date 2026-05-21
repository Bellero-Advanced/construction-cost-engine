/**
 * GET /api/admin/scrape-debug?source=homepro&material=CEMENT_001
 *
 * Returns the live HTML + extracted snippet from a retail SPA via the
 * Browser Rendering binding. Used to tune selectors after deploy:
 *
 *   curl "$WORKER/api/admin/scrape-debug?source=homepro&material=CEMENT_001" \
 *     -H "x-admin-token: $ADMIN_REFRESH_TOKEN" | jq .
 *
 * Auth-gated to avoid leaking Browser Rendering quota.
 */

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { materialQuery } from "@/lib/scrapers/_headless";

const RETAIL_URLS: Record<string, string> = {
  homepro: "https://www.homepro.co.th/search?q={q}",
  globalhouse: "https://www.globalhouse.co.th/search?q={q}",
  thaiwatsadu: "https://www.thaiwatsadu.com/th/search?keyword={q}",
  bnb: "https://www.bnbhome.com/search?q={q}",
  scghome: "https://www.scghome.com/search?keyword={q}",
  dohome: "https://www.dohome.co.th/c/search?q={q}",
  megahome: "https://www.megahome.co.th/search?q={q}",
};

async function getEnv() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as CloudflareEnv | undefined;
    return { browser: env?.BROWSER, token: env?.ADMIN_REFRESH_TOKEN };
  } catch {
    return { browser: undefined, token: process.env.ADMIN_REFRESH_TOKEN };
  }
}

export async function GET(req: Request) {
  const { browser, token } = await getEnv();
  const url = new URL(req.url);
  const reqToken =
    req.headers.get("x-admin-token") ?? url.searchParams.get("token");
  if (token && reqToken !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const source = url.searchParams.get("source") ?? "homepro";
  const material = url.searchParams.get("material") ?? "CEMENT_001";
  const tmpl = RETAIL_URLS[source];
  if (!tmpl) {
    return NextResponse.json(
      { error: "unknown retail source" },
      { status: 404 },
    );
  }
  if (!browser) {
    return NextResponse.json(
      {
        error:
          "BROWSER binding unavailable (Workers Paid + Browser Rendering required)",
      },
      { status: 503 },
    );
  }

  let puppeteer;
  try {
    puppeteer = await import("@cloudflare/puppeteer");
  } catch (e) {
    return NextResponse.json(
      { error: "puppeteer import failed", detail: (e as Error).message },
      { status: 500 },
    );
  }

  const targetUrl = tmpl.replace(
    "{q}",
    encodeURIComponent(materialQuery(material)),
  );
  const launched = await puppeteer.launch(
    browser as unknown as Parameters<typeof puppeteer.launch>[0],
  );
  try {
    const page = await launched.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    );
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 25_000 });
    const title = await page.title().catch(() => "");
    const html = await page.content();
    const trimmed =
      html.length > 60_000 ? html.slice(0, 60_000) + "…[truncated]" : html;

    // Heuristic: harvest any THB-looking number nodes for tuning hint
    const samplePrices = await page
      .evaluate(() => {
        const out: { tag: string; cls: string; text: string }[] = [];
        const re = /\d{2,6}(?:\.\d{1,2})?/;
        const all = Array.from(document.querySelectorAll("*")).slice(0, 4000);
        for (const el of all) {
          const txt = (el.textContent ?? "").trim();
          if (
            txt.length < 20 &&
            re.test(txt) &&
            txt.replace(/[^0-9.,]/g, "").length >= 2
          ) {
            out.push({
              tag: el.tagName.toLowerCase(),
              cls: (el as HTMLElement).className?.toString?.() ?? "",
              text: txt,
            });
            if (out.length >= 20) break;
          }
        }
        return out;
      })
      .catch(() => []);

    return NextResponse.json({
      source,
      material,
      targetUrl,
      title,
      htmlLength: html.length,
      htmlPreview: trimmed,
      samplePrices,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "scrape failed", detail: (e as Error).message },
      { status: 500 },
    );
  } finally {
    await launched.close().catch(() => null);
  }
}
