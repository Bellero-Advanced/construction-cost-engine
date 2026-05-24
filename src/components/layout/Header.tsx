"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "home", href: "/" },
  { key: "wall_tile", href: "/wall-tile" },
  { key: "column_beam", href: "/column-beam" },
  { key: "rebar", href: "/rebar" },
  { key: "paint", href: "/paint" },
  { key: "brick", href: "/brick" },
  { key: "compare", href: "/compare" },
  { key: "compare_sources", href: "/compare-sources" },
  { key: "stores", href: "/stores" },
  { key: "trend", href: "/trend" },
  { key: "source", href: "/sources" },
  { key: "health", href: "/health" },
  { key: "api_docs", href: "/api-docs" },
];

export default function Header() {
  const tBrand = useTranslations("brand");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative border-b-4 border-amber bg-ink text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 12% 50%, rgba(217,119,6,0.18), transparent 35%), radial-gradient(circle at 88% 50%, rgba(14,124,123,0.15), transparent 35%)",
        }}
      />
      <div className="relative mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center border-2 border-paper bg-amber font-display text-[20px] text-ink"
            style={{
              boxShadow: "3px 3px 0 var(--color-ink-3)",
              transform: "rotate(-2deg)",
            }}
          >
            {tBrand("mark")}
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="font-display text-[15px] tracking-[0.04em] text-paper sm:text-[17px]">
              {tBrand("title")}
            </h1>
            <div className="hidden font-mono text-[9px] uppercase tracking-[0.15em] text-amber-bright sm:block">
              {tBrand("subtitle")}
            </div>
          </div>
        </Link>

        <nav
          id="primary-nav"
          className="ml-auto hidden items-center gap-0.5 lg:flex"
        >
          {NAV.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.key}
                href={n.href}
                className={cn(
                  "border border-transparent px-2.5 py-1.5 font-sans text-[12px] font-medium uppercase tracking-[0.04em]",
                  active
                    ? "bg-amber font-bold text-ink"
                    : "text-paper hover:border-amber hover:text-amber-bright",
                )}
              >
                {tNav(n.key)}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
          className="ml-auto inline-flex items-center justify-center border-2 border-amber bg-ink-3/40 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider text-amber-bright lg:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          id="mobile-nav"
          className="relative flex flex-col gap-1 border-t border-amber/30 px-4 pb-3 pt-2 sm:px-6 lg:hidden"
        >
          {NAV.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border border-transparent px-3 py-2 font-sans text-[13px] font-medium uppercase tracking-[0.05em]",
                  active
                    ? "bg-amber font-bold text-ink"
                    : "text-paper hover:border-amber hover:text-amber-bright",
                )}
              >
                {tNav(n.key)}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
