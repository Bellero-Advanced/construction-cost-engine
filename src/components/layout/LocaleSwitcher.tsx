"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { locales, defaultLocale, type Locale } from "@/i18n";

const LABELS: Record<Locale, string> = {
  th: "TH",
  en: "EN",
  zh: "中",
};

function getCurrentLocale(pathname: string): Locale {
  const seg = pathname.split("/")[1];
  if ((locales as readonly string[]).includes(seg)) return seg as Locale;
  return defaultLocale;
}

function withLocale(pathname: string, target: Locale): string {
  const segs = pathname.split("/");
  const first = segs[1];
  const rest = (locales as readonly string[]).includes(first)
    ? "/" + segs.slice(2).join("/")
    : pathname;
  const cleanRest = rest === "/" ? "" : rest;
  // as-needed: omit prefix for the default locale
  return target === defaultLocale ? cleanRest || "/" : `/${target}${cleanRest}`;
}

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const current = getCurrentLocale(pathname);

  return (
    <div className="flex items-center gap-0.5 border border-amber/40 bg-ink-3/40 p-0.5">
      {locales.map((l) => {
        const active = l === current;
        return (
          <button
            key={l}
            type="button"
            onClick={() => router.push(withLocale(pathname, l))}
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "bg-amber px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-ink"
                : "px-2.5 py-1 font-mono text-[11px] tracking-wider text-paper/70 hover:text-amber-bright"
            }
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}

export const _internal = { withLocale, getCurrentLocale };

// Re-export for convenience in tests / debugging.
export default LocaleSwitcher;
