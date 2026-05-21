/**
 * KV-backed per-IP rate limiter for /api/prices/[source]/[material].
 *
 * Caps Browser Rendering cost on retail-source endpoints. Govt sources
 * (tpso/cgd/dit) read from KV only and are cheap, but we still apply
 * a generous limit to prevent abuse.
 *
 * Limits (per IP, fixed window):
 *   - retail sources: 30 req / min
 *   - govt sources:   120 req / min
 *
 * Returns null when allowed, or a Response when blocked.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { SourceKey } from "@/types";

const RETAIL_KEYS: SourceKey[] = [
  "homepro",
  "globalhouse",
  "thaiwatsadu",
  "bnb",
  "scghome",
  "dohome",
  "megahome",
];

interface RateLimitConfig {
  windowSec: number;
  max: number;
}

function configFor(source: string): RateLimitConfig {
  if (RETAIL_KEYS.includes(source as SourceKey)) {
    return { windowSec: 60, max: 30 };
  }
  return { windowSec: 60, max: 120 };
}

function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "anon"
  );
}

async function getKv(): Promise<KVNamespace | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns null when the request should proceed, or a 429 Response
 * when the caller has exceeded their window quota.
 */
export async function enforceRateLimit(
  req: Request,
  source: string,
): Promise<Response | null> {
  const kv = await getKv();
  if (!kv) return null; // local dev / no binding — skip

  const cfg = configFor(source);
  const ip = getClientIp(req);
  const window = Math.floor(Date.now() / 1000 / cfg.windowSec);
  const key = `rl:${source}:${ip}:${window}`;

  const current = parseInt((await kv.get(key)) ?? "0", 10);
  if (current >= cfg.max) {
    const reset = (window + 1) * cfg.windowSec;
    return new Response(
      JSON.stringify({
        error: "rate limited",
        limit: cfg.max,
        windowSec: cfg.windowSec,
        retryAfter: reset - Math.floor(Date.now() / 1000),
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(reset - Math.floor(Date.now() / 1000)),
          "x-ratelimit-limit": String(cfg.max),
          "x-ratelimit-remaining": "0",
        },
      },
    );
  }

  await kv.put(key, String(current + 1), {
    expirationTtl: cfg.windowSec * 2,
  });
  return null;
}
