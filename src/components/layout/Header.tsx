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
  { key: "compare", href: "/compare" },
  { key: "stores", href: "/stores" },
  { key: "trend", href: "/trend" },
  { key: "source", href: "/sources" },
];

export default function Header() {
  const tBrand = useTranslations("brand");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative overflow-hidden border-b-4 border-amber bg-ink text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 12% 50%, rgba(217,119,6,0.18), transparent 35%), radial-gradient(circle at 88% 50%, rgba(14,124,123,0.15), transparent 35%)",
        }}
      />
      <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-[22px]">
        <Link href="/" className="flex items-center gap-3 sm:gap-4">
          <div
            className="flex h-11 w-11 items-center justify-center border-2 border-paper bg-amber font-display text-[24px] text-ink sm:h-14 sm:w-14 sm:text-[32px]"
            style={{
              boxShadow: "4px 4px 0 var(--color-ink-3)",
              transform: "rotate(-2deg)",
            }}
          >
            {tBrand("mark")}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[18px] leading-tight tracking-[0.04em] text-paper sm:text-[22px] lg:text-[26px]">
              {tBrand("title")}
            </h1>
            <div className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-amber-bright sm:block sm:text-[11px] sm:tracking-[0.15em]">
              {tBrand("subtitle")}
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label="Toggle navigation"
          className="ml-auto inline-flex items-center justify-center border-2 border-amber bg-ink-3/40 px-3 py-2 font-mono text-[12px] font-bold tracking-wider text-amber-bright lg:hidden"
        >
          {open ? "✕ ปิด" : "☰ เมนู"}
        </button>

        <nav
          id="primary-nav"
          className={cn(
            "w-full lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:gap-1",
            open ? "flex flex-col gap-1" : "hidden",
          )}
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
                  "border border-transparent px-3.5 py-2.5 font-sans text-[13px] font-medium uppercase tracking-[0.05em] lg:py-2",
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
      </div>
    </header>
  );
}
