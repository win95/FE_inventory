// Catalogue định dạng quảng cáo (R1-3, FE 31): lọc theo loại (video /
// banner / chữ), xem trước trên khung điện thoại, bảng thông số. Xem trước
// media an toàn: khi một format có previewUrl thì render iframe sandboxed
// + lazy (không cho script chạy ngoài sandbox, không autoplay); dữ liệu R1
// chưa có previewUrl nên khung điện thoại là bản xem trước mặc định.
"use client";

import { useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";
import type { AdFormatType, CmsAdFormat } from "@/lib/types";

type Filter = "all" | AdFormatType;

const FILTERS: Filter[] = ["all", "video", "banner", "text"];

export default function AdFormatCatalog({ formats }: { formats: (CmsAdFormat & { previewUrl?: string })[] }) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(formats[0]?.slug ?? null);

  const visible = useMemo(
    () => (filter === "all" ? formats : formats.filter((f) => f.formatType === filter)),
    [formats, filter],
  );
  const selected = visible.find((f) => f.slug === selectedSlug) ?? visible[0] ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("adfmt.title")}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === f ? "bg-brand text-white" : "border border-border bg-white text-ink hover:border-brand"
              }`}
            >
              {f === "all" ? t("adfmt.filterAll") : t(`adfmt.filter${f === "video" ? "Video" : f === "banner" ? "Banner" : "Text"}` as "adfmt.filterVideo" | "adfmt.filterBanner" | "adfmt.filterText")}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t("adfmt.empty")}</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((f) => (
              <li key={f.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(f.slug)}
                  aria-pressed={selected?.slug === f.slug}
                  className={`w-full rounded-2xl border p-5 text-left ${
                    selected?.slug === f.slug ? "border-brand bg-white" : "border-border bg-white hover:border-brand"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">{f.name}</span>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                      {f.durationSeconds !== null ? t("adfmt.duration", { n: String(f.durationSeconds) }) : "—"}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{f.description}</span>
                  <span className="mt-2 block text-sm text-muted">
                    {f.metricLabel}: <strong className="text-ink">{f.metricValue === null ? "—" : `${f.metricValue}%`}</strong>
                    {f.solutionName ? ` · ${f.solutionName}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="lg:col-span-2">
        {selected && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("adfmt.phoneLabel")}</p>
            <div className="mx-auto mt-3 w-64 rounded-[2rem] border-4 border-ink bg-white p-4 shadow-lg">
              <div className="mx-auto h-1.5 w-16 rounded-full bg-line" aria-hidden="true" />
              <div className="mt-4 rounded-xl bg-surface p-4 text-center">
                <p className="font-display text-lg font-black text-ink">{selected.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {selected.durationSeconds !== null
                    ? t("adfmt.duration", { n: String(selected.durationSeconds) })
                    : "—"}
                </p>
                <p className="mt-2 text-sm">
                  {selected.metricLabel}: <strong className="text-brand">{selected.metricValue === null ? "—" : `${selected.metricValue}%`}</strong>
                </p>
              </div>
              <p className="mt-3 text-center text-xs text-muted">{selected.description}</p>
            </div>
            {selected.previewUrl ? (
              <iframe
                src={selected.previewUrl}
                title={`${t("adfmt.preview")}: ${selected.name}`}
                sandbox="allow-scripts"
                loading="lazy"
                className="mt-4 aspect-video w-full rounded-xl border border-border"
              />
            ) : null}
            <h2 className="mt-6 font-display text-xl font-black text-ink">{t("adfmt.specTitle")}</h2>
            <dl className="mt-3 space-y-2 rounded-2xl border border-border bg-white p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("adfmt.specType")}</dt>
                <dd className="font-semibold text-ink">
                  {t(`adfmt.filter${selected.formatType === "video" ? "Video" : selected.formatType === "banner" ? "Banner" : "Text"}` as "adfmt.filterVideo" | "adfmt.filterBanner" | "adfmt.filterText")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("adfmt.specDuration")}</dt>
                <dd className="font-semibold text-ink">
                  {selected.durationSeconds !== null ? t("adfmt.duration", { n: String(selected.durationSeconds) }) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{selected.metricLabel}</dt>
                <dd className="font-semibold text-ink">{selected.metricValue === null ? "—" : `${selected.metricValue}%`}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("adfmt.specSolution")}</dt>
                <dd className="font-semibold text-ink">{selected.solutionName ?? "—"}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
