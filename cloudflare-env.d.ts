/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  PRICES_KV?: KVNamespace;
  ADMIN_REFRESH_TOKEN?: string;
}
