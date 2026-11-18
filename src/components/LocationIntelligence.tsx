"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchCoverage } from "@/lib/api";
import type { CoverageResponse, LoadState } from "@/lib/types";
import HeatmapCard from "./HeatmapCard";
import { useLocale } from "./LocaleProvider";

// Location Intelligence + bản đồ nhiệt (F04) trên trang chủ, theo trang
// mẫu Figma: eyebrow đỏ in hoa, tiêu đề Barlow Condensed Black in hoa,
// thẻ mini trắng số đỏ, nút Explore đỏ, thẻ heatmap (xem HeatmapCard).
// Dữ liệu phủ sóng lấy từ backend (SQLite) — database rỗng thì hiện trạng
// thái rỗng, không tự điền số.
export default function LocationIntelligence({ showExploreLink = true }: { showExploreLink?: boolean }) {
  const { locale, t } = useLocale();
  const [state, setState] = useState<LoadState<CoverageResponse>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchCoverage(locale)
      .then((data) => {
        if (cancelled) return;
        if (!data || data.provinces.length === 0) setState({ status: "empty" });
        else setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof ApiError ? err.message : t("coverage.loadFailed"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  return (
    <section aria-label="Location Intelligence" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-widest text-brand uppercase">Location Intelligence</p>
      <h2 className="mt-2 max-w-xl font-display text-4xl leading-[0.95] font-black tracking-tight text-ink uppercase sm:text-5xl">
        Reach users where they actually are
      </h2>
      <p className="mt-3 max-w-2xl text-muted">{t("coverage.description")}</p>

      {state.status === "loading" && (
        <div className="mt-8 animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-border" />
          ))}
        </div>
      )}

      {state.status === "empty" && (
        <div className="mt-8 rounded-2xl border border-dashed border-outline bg-white p-6 text-center">
          <p className="font-medium text-ink">{t("coverage.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("coverage.emptyBody")}</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-8 rounded-2xl border border-badge-border bg-badge-bg p-6 text-center">
          <p className="font-medium text-brand">{t("coverage.loadFailed")}</p>
          <p className="mt-1 text-sm text-brand/80">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <>
          {state.data.venueTypes.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {state.data.venueTypes.map((venue) => (
                <div key={venue.type} className="rounded-xl border border-border bg-white p-4">
                  <p className="text-2xl font-bold text-brand">
                    {venue.count.toLocaleString("en-US")}
                  </p>
                  <p className="mt-1 text-sm text-muted">{venue.type}</p>
                </div>
              ))}
            </div>
          )}

          {showExploreLink && (
            <Link href="/locations" className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              Explore Full Location Network →
            </Link>
          )}

          <div className="mt-8">
            <HeatmapCard provinces={state.data.provinces} />
          </div>
        </>
      )}
    </section>
  );
}
