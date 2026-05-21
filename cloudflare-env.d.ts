/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  PRICES_KV?: KVNamespace;
  BROWSER?: Fetcher;
  ADMIN_REFRESH_TOKEN?: string;
}
