"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-7 py-[22px]">
        <Link href="/" className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center border-2 border-paper bg-amber font-display text-[32px] text-ink"
            style={{
              boxShadow: "4px 4px 0 var(--color-ink-3)",
              transform: "rotate(-2deg)",
            }}
          >
            {tBrand("mark")}
          </div>
          <div>
            <h1 className="font-display text-[26px] leading-tight tracking-[0.04em] text-paper">
              {tBrand("title")}
            </h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-amber-bright">
              {tBrand("subtitle")}
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-1">
          {NAV.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.key}
                href={n.href}
                className={cn(
                  "border border-transparent px-3.5 py-2 font-sans text-[13px] font-medium uppercase tracking-[0.05em] transition-all duration-150",
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
