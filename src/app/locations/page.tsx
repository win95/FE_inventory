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
    value === null || value === undefined ? "—" : value.toLocaleString("vi-VN");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          AWING Location Network
        </h1>
        <Link href="/" className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200">
          ← Home
        </Link>
      </div>

      {state.status === "loading" && (
        <div className="mt-10 animate-pulse space-y-4" aria-label="Đang tải dữ liệu mạng lưới">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/40">
          <p className="font-medium text-red-700 dark:text-red-300">Không tải được dữ liệu mạng lưới</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.message}</p>
          <button type="button" onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
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
                  { label: "Lượt kết nối", value: formatNumber(state.stats.connections) },
                  { label: "Tỉnh thành phố", value: `${formatNumber(state.stats.provinces)}/63` },
                  { label: "Chuỗi hệ thống", value: formatNumber(state.stats.chains) },
                  { label: "Địa điểm phủ sóng", value: formatNumber(state.stats.venues) },
                ].map((cell) => (
                  <div key={cell.label} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
                    <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{cell.value}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{cell.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                <p className="font-medium text-zinc-700 dark:text-zinc-200">Chưa có số liệu mạng lưới</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Thêm bản ghi vào SQLite thì các ô số liệu sẽ hiện ở đây.
                </p>
              </div>
            )}
          </section>

          <LocationIntelligence showExploreLink={false} />

          <section aria-label="Số liệu theo ngành" className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Engagement by Industry</h2>
            {!state.coverage.industryStats || state.coverage.industryStats.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Chưa có dữ liệu theo ngành từ backend. Thêm số liệu theo ngành vào SQLite thì biểu đồ sẽ hiện ở đây.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {[...state.coverage.industryStats]
                    .sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))
                    .map((row) => (
                      <li key={row.industry} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {row.industry}
                        </span>
                        <span className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                          <span
                            className="block h-full bg-red-600"
                            style={{ width: `${Math.min(100, Math.max(0, row.engagement ?? 0))}%` }}
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right text-sm text-zinc-600 dark:text-zinc-300">
                          {row.engagement === null ? "—" : `${row.engagement}%`}
                        </span>
                      </li>
                    ))}
                </ul>
                <h3 className="mt-8 text-base font-semibold text-zinc-900 dark:text-zinc-50">Reach vs Engagement</h3>
                <ul className="mt-3 space-y-2">
                  {state.coverage.industryStats.map((row) => (
                    <li key={row.industry} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">{row.industry}</span>
                      <span className="text-zinc-600 dark:text-zinc-300">
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
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Drill deeper
              </button>
              <button
                type="button"
                onClick={() => setAuthTitle("Brand-level breakdown")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Brand-level breakdown
              </button>
            </div>
          </section>

          <section aria-label="Thư mục địa điểm" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Location Directory</h2>
              <button
                type="button"
                onClick={() => setAuthTitle("Sign in to view all locations")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Sign in to view all
              </button>
            </div>
            {!state.coverage.directory || state.coverage.directory.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Chưa có thư mục địa điểm từ backend. Thêm chuỗi/địa điểm vào SQLite thì danh sách sẽ hiện ở đây.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2" aria-label="Lọc theo loại địa điểm">
                  <button
                    type="button"
                    aria-pressed={category === null}
                    onClick={() => setCategory(null)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      category === null
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
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
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        category === c
                          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                          : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
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
                        className="w-full rounded-2xl border border-zinc-200 p-5 text-left hover:border-red-600 dark:border-zinc-800 dark:hover:border-red-500"
                      >
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{entry.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{entry.category}</p>
                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
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
