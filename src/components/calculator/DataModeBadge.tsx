"use client";

import { useEffect, useState } from "react";

interface SourceStatus {
  key: string;
  name: string;
  live: boolean;
  mode: "live" | "mock";
}

export function DataModeBadge({ source }: { source: string }) {
  const [status, setStatus] = useState<SourceStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/prices/status")
      .then((r) => r.json() as Promise<{ sources: SourceStatus[] }>)
      .then((data) => {
        if (cancelled) return;
        const s = data.sources.find((x) => x.key === source);
        if (s) setStatus(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-ink/20 bg-paper-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink/60">
        <span className="h-1.5 w-1.5 rounded-full bg-ink/30" /> Checking…
      </span>
    );
  }

  if (status.live) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-green/40 bg-green/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-green">
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        LIVE · {status.name}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 border border-amber/40 bg-amber/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber"
      title="Provider not registered — using deterministic mock prices. See src/lib/scrapers/ to plug in a real source."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber" />
      MOCK · {status.name}
    </span>
  );
}
