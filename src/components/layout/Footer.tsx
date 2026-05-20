import { useTranslations } from "next-intl";
import { SOURCES } from "@/data/sources";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-12 border-t-4 border-amber bg-ink px-4 pt-8 pb-6 text-paper sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-6 border-b border-dashed border-line pb-5 md:grid-cols-3">
          <div>
            <h5 className="mb-2 font-display text-[18px] tracking-[0.05em] text-amber">
              {t("about")}
            </h5>
            <p className="text-xs text-paper/65">{t("aboutText")}</p>
          </div>
          <div>
            <h5 className="mb-2 font-display text-[18px] tracking-[0.05em] text-amber">
              {t("sources")}
            </h5>
            <ul className="space-y-0.5 text-xs text-paper/65">
              {Object.values(SOURCES).map((s) => (
                <li key={s.key}>
                  ● {s.short} — {s.url.replace(/https?:\/\//, "")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="mb-2 font-display text-[18px] tracking-[0.05em] text-amber">
              {t("disclaimer")}
            </h5>
            <p className="text-xs text-paper/65">{t("disclaimerText")}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-paper/45">
          <span>{t("build")}</span>
          <span>{t("copy")}</span>
        </div>
      </div>
    </footer>
  );
}
