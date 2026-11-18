"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, fetchCoverage, fetchNetworkStats } from "@/lib/api";
import type { CoverageResponse, NetworkStats } from "@/lib/types";
import LocationIntelligence from "@/components/LocationIntelligence";
import AdvertiserAuthModal from "@/components/AdvertiserAuthModal";

// Màn AWING Location Network, khớp hành vi click trên Figma
// (~14:03 +07, 18/11): mở từ nút Explore Location Network ở dải số liệu
// hoặc Explore Full Location Network ở mục Location Intelligence.
// Số liệu, heatmap, thư mục địa điểm đều lấy từ backend (SQLite).
// "Drill deeper", "Brand-level breakdown", bấm vào một địa điểm trong thư
// mục và "Sign in to view all" đều mở popup yêu cầu tài khoản advertiser.
// Mục theo ngành chỉ hiện khi backend cung cấp — không tự bịa số liệu.

type PageState =
  | { status: "loading" }
  | { status: "ready"; stats: NetworkStats | null; coverage: CoverageResponse }
  | { status: "error"; message: string };

export default function LocationsPage() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [category, setCategory] = useState<string | null>(null);
  const [authTitle, setAuthTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchNetworkStats(), fetchCoverage()])
      .then(([stats, coverage]) => {
        if (cancelled) return;
        setState({
          status: "ready",
          stats,
          coverage: coverage ?? { provinces: [], venueTypes: [] },
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof ApiError ? err.message : "Không tải được dữ liệu mạng lưới.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    if (state.status !== "ready" || !state.coverage.directory) return [];
    return [...new Set(state.coverage.directory.map((d) => d.category))];
  }, [state]);

  const directory = useMemo(() => {
    if (state.status !== "ready" || !state.coverage.directory) return [];
    if (!category) return state.coverage.directory;
    return state.coverage.directory.filter((d) => d.category === category);
  }, [state, category]);

  const formatNumber = (value: number | null) =>
    value === null || value === undefined ? "—" : value.toLocaleString("en-US");

  // Số hiển thị dạng gọn như trên trang mẫu Figma (25.4M, 10,953).
  const formatCompact = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    return value.toLocaleString("en-US");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          AWING Location Network
        </h1>
        <Link href="/" className="rounded-lg border border-outline px-4 py-2 text-sm font-medium text-muted hover:border-muted">
          ← Home
        </Link>
      </div>

      {state.status === "loading" && (
        <div className="mt-10 animate-pulse space-y-4" aria-label="Đang tải dữ liệu mạng lưới">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-border" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-10 rounded-2xl border border-badge-border bg-badge-bg p-8 text-center">
          <p className="font-medium text-brand">Không tải được dữ liệu mạng lưới</p>
          <p className="mt-1 text-sm text-brand">{state.message}</p>
          <button type="button" onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Thử lại
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <section aria-label="Tổng quan mạng lưới" className="mt-10">
            {state.stats ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "Lượt kết nối", value: formatCompact(state.stats.connections) },
                  { label: "Tỉnh thành phố", value: `${formatCompact(state.stats.provinces)}/63` },
                  { label: "Chuỗi hệ thống", value: `${formatCompact(state.stats.chains)}+` },
                  { label: "Địa điểm phủ sóng", value: formatCompact(state.stats.venues) },
                ].map((cell) => (
                  <div key={cell.label} className="rounded-xl border border-border bg-white p-5">
                    <p className="text-2xl font-bold text-ink">{cell.value}</p>
                    <p className="mt-1 text-sm text-muted">{cell.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-outline p-6 text-center">
                <p className="font-medium text-muted">Chưa có số liệu mạng lưới</p>
                <p className="mt-1 text-sm text-muted">
                  Thêm bản ghi vào SQLite thì các ô số liệu sẽ hiện ở đây.
                </p>
              </div>
            )}
          </section>

          <LocationIntelligence showExploreLink={false} />

          <section aria-label="Số liệu theo ngành" className="mt-10">
            <h2 className="text-xl font-bold text-ink">Engagement by Industry</h2>
            {!state.coverage.industryStats || state.coverage.industryStats.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Chưa có dữ liệu theo ngành từ backend. Thêm số liệu theo ngành vào SQLite thì biểu đồ sẽ hiện ở đây.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {[...state.coverage.industryStats]
                    .sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))
                    .map((row) => (
                      <li key={row.industry} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm font-medium text-muted">
                          {row.industry}
                        </span>
                        <span className="h-3 flex-1 overflow-hidden rounded-lg bg-border">
                          <span
                            className="block h-full bg-brand"
                            style={{ width: `${Math.min(100, Math.max(0, row.engagement ?? 0))}%` }}
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right text-sm text-muted">
                          {row.engagement === null ? "—" : `${row.engagement}%`}
                        </span>
                      </li>
                    ))}
                </ul>
                <h3 className="mt-8 text-base font-bold text-ink">Reach vs Engagement</h3>
                <ul className="mt-3 space-y-2">
                  {state.coverage.industryStats.map((row) => (
                    <li key={row.industry} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3 text-sm">
                      <span className="font-medium text-muted">{row.industry}</span>
                      <span className="text-muted">
                        Reach {row.reach === null ? "—" : formatNumber(row.reach)} · Engagement{" "}
                        {row.engagement === null ? "—" : `${row.engagement}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAuthTitle("Drill deeper into location data")}
                className="rounded-lg border border-outline px-4 py-2 text-sm font-medium text-muted hover:border-muted"
              >
                Drill deeper
              </button>
              <button
                type="button"
                onClick={() => setAuthTitle("Brand-level breakdown")}
                className="rounded-lg border border-outline px-4 py-2 text-sm font-medium text-muted hover:border-muted"
              >
                Brand-level breakdown
              </button>
            </div>
          </section>

          <section aria-label="Thư mục địa điểm" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">Location Directory</h2>
              <button
                type="button"
                onClick={() => setAuthTitle("Sign in to view all locations")}
                className="rounded-lg border border-outline px-4 py-2 text-sm font-medium text-muted hover:border-muted"
              >
                Sign in to view all
              </button>
            </div>
            {!state.coverage.directory || state.coverage.directory.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Chưa có thư mục địa điểm từ backend. Thêm chuỗi/địa điểm vào SQLite thì danh sách sẽ hiện ở đây.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2" aria-label="Lọc theo loại địa điểm">
                  <button
                    type="button"
                    aria-pressed={category === null}
                    onClick={() => setCategory(null)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      category === null
                        ? "border border-chip-border bg-chip-bg text-ink"
                        : "border border-transparent text-muted hover:border-outline"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={category === c}
                      onClick={() => setCategory(c)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        category === c
                          ? "border border-chip-border bg-chip-bg text-ink"
                          : "border border-transparent text-muted hover:border-outline"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {directory.map((entry) => (
                    <li key={entry.name}>
                      <button
                        type="button"
                        onClick={() => setAuthTitle(`View details for ${entry.name}`)}
                        className="w-full rounded-2xl border border-border p-5 text-left hover:border-brand"
                      >
                        <h3 className="font-semibold text-ink">{entry.name}</h3>
                        <p className="mt-1 text-sm text-muted">{entry.category}</p>
                        <p className="mt-3 text-sm text-muted">
                          {formatNumber(entry.venues)} điểm
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      {authTitle && <AdvertiserAuthModal title={authTitle} onClose={() => setAuthTitle(null)} />}
    </main>
  );
}
