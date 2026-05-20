import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { SOURCES } from "@/data/sources";
import { Doc } from "@/components/ui/Doc";

const STATS = [
  { num: "20", key: "materials", unit: "MATERIALS" },
  { num: "10", key: "provinces", unit: "PROVINCES" },
  { num: "6", key: "sources", unit: "DATA SOURCES" },
  { num: "12", key: "months", unit: "MONTHS" },
];

const CATEGORIES = [
  { num: "01", key: "wall_tile", href: "/wall-tile" },
  { num: "02", key: "column_beam", href: "/column-beam" },
  { num: "03", key: "rebar", href: "/rebar" },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="page-in">
      <Doc tag={t("docTag")}>
        <div className="grid items-stretch gap-8 md:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-dashed border-line pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <h2
              className="mb-4 font-display leading-[0.95] tracking-[0.01em]"
              style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
            >
              {t("title1")}
              <br />
              {t("title2")}
              <br />
              <span className="block text-amber">
                <span className="text-rust">▸ </span>
                {t("titleAccent")}
              </span>
            </h2>
            <p className="max-w-[540px] text-[15px] text-ink-2">
              {t.rich("description", {
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <div className="mt-5 flex flex-wrap gap-6 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
              <span>
                <strong className="text-amber">SRC:</strong> {t("metaSources")}
              </span>
              <span>
                <strong className="text-amber">REF:</strong> {t("metaRef")}
              </span>
              <span>
                <strong className="text-amber">STATUS:</strong>{" "}
                <span className="text-green">●</span> {t("metaStatus")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {STATS.map((s) => (
              <div
                key={s.key}
                className="grid grid-cols-[60px_1fr_auto] items-center border-l-4 border-amber bg-ink px-4 py-3 text-paper"
              >
                <div className="font-display text-[36px] leading-none text-amber-bright">
                  {s.num}
                </div>
                <div className="text-[13px] font-medium">
                  {t(`stats.${s.key}`)}
                  <br />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper/50">
                    {s.unit}
                  </span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper/50">
                  ▌
                </div>
              </div>
            ))}
          </div>
        </div>
      </Doc>

      <SectionHead title={t("sourcesHead")} refLabel={t("sourcesRef")} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(SOURCES).map((s) => (
          <div
            key={s.key}
            className="overflow-hidden border-[1.5px] border-ink bg-paper hover:shadow-[5px_5px_0_var(--color-ink)]"
          >
            <div
              className="flex items-center justify-between px-[18px] py-3.5 text-white"
              style={{ background: s.color }}
            >
              <div className="font-display text-[22px] tracking-[0.03em]">
                {s.short}
              </div>
              <span className="bg-white/20 px-2 py-[3px] font-mono text-[9px] font-bold tracking-[0.15em] text-white">
                {s.badge}
              </span>
            </div>
            <div className="px-[18px] py-4">
              <div className="mb-3 min-h-[36px] text-xs text-ink-2">
                {s.desc}
              </div>
              <div className="mb-3 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 font-mono text-[10px] text-ink-3">
                <span className="text-rust uppercase tracking-[0.1em]">
                  TYPE:
                </span>
                <span>{s.type}</span>
                <span className="text-rust uppercase tracking-[0.1em]">
                  UPDATE:
                </span>
                <span>{s.updateFreq}</span>
                <span className="text-rust uppercase tracking-[0.1em]">
                  COVERAGE:
                </span>
                <span>{s.coverage}</span>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-dashed font-mono text-[11px] font-bold uppercase tracking-[0.1em] no-underline"
                style={{ color: s.color }}
              >
                {s.url.replace(/https?:\/\//, "")} →
              </a>
            </div>
          </div>
        ))}
      </div>

      <SectionHead title={t("categoriesHead")} refLabel={t("categoriesRef")} />
      <div className="grid gap-5 md:grid-cols-3">
        {CATEGORIES.map((c) => {
          const items = t.raw(`categories.${c.key}.items`) as string[];
          return (
            <Link
              key={c.key}
              href={c.href}
              className="group relative block overflow-hidden border-[1.5px] border-ink bg-paper p-[22px] hover:shadow-[5px_5px_0_var(--color-ink)]"
            >
              <div className="absolute right-3 top-2 z-0 font-display text-[64px] leading-none text-paper-2">
                {c.num}
              </div>
              <div className="relative mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rust">
                {t(`categories.${c.key}.tag`)}
              </div>
              <h4 className="relative mb-2.5 font-display text-[26px] tracking-[0.02em]">
                {t(`categories.${c.key}.title`)}
              </h4>
              <div className="relative mb-4 text-[13px] text-ink-2">
                {t(`categories.${c.key}.desc`)}
              </div>
              <ul className="relative mb-[18px] space-y-0">
                {items.map((it, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 border-b border-dashed border-paper-2 py-1 text-xs text-ink-3"
                  >
                    <span className="text-[8px] text-amber">◆</span>
                    {it}
                  </li>
                ))}
              </ul>
              <span className="relative inline-flex items-center gap-1.5 bg-ink px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-amber">
                {t("cta")}
                <span className="group-hover:translate-x-1">→</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SectionHead({ title, refLabel }: { title: string; refLabel: string }) {
  return (
    <div className="my-8 flex items-baseline gap-4 border-b-2 border-ink pb-2">
      <h3 className="font-display text-[28px] tracking-[0.03em]">{title}</h3>
      <span className="ml-auto font-mono text-[11px] text-ink-3">
        {refLabel}
      </span>
    </div>
  );
}
