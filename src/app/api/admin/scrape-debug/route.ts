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
    // Extra settle for client-side hydration / lazy product render
    await new Promise((res) => setTimeout(res, 3000));
    const title = await page.title().catch(() => "");
    const html = await page.content();

    /**
     * Heuristic: walk the post-hydration DOM for elements that contain
     * BOTH a Thai price marker (฿/บาท/ราคา) AND a digit run >= 2.
     * Returns outerHTML snippet + a computed selector hint so a human
     * can pick the real card class.
     */
    const candidates = await page
      .evaluate(() => {
        const re = /(?:฿|บาท|ราคา)/;
        const out: { selector: string; price: string; html: string }[] = [];
        const nodes = Array.from(document.querySelectorAll("*"));
        for (const el of nodes) {
          const txt = (el.textContent ?? "").trim();
          if (txt.length < 6 || txt.length > 200) continue;
          if (!re.test(txt)) continue;
          const numMatch = txt
            .replace(/,/g, "")
            .match(/(\d{2,6}(?:\.\d{1,2})?)/);
          if (!numMatch) continue;
          const tag = el.tagName.toLowerCase();
          const cls = (el as HTMLElement).className?.toString?.() ?? "";
          const id = (el as HTMLElement).id ?? "";
          const sel =
            tag +
            (id ? `#${id}` : "") +
            (cls
              ? "." + cls.split(/\s+/).filter(Boolean).slice(0, 3).join(".")
              : "");
          out.push({
            selector: sel,
            price: numMatch[1],
            html: ((el as HTMLElement).outerHTML ?? "").slice(0, 400),
          });
          if (out.length >= 8) break;
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
      htmlSnippet: html.slice(0, 4000),
      candidates,
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
