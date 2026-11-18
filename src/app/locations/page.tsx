"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiError, fetchCoverage, fetchNetworkStats } from "@/lib/api";
import type { CoverageResponse, NetworkStats } from "@/lib/types";
import HeatmapCard from "@/components/HeatmapCard";
import AdvertiserAuthModal from "@/components/AdvertiserAuthModal";
import { useLocale } from "@/components/LocaleProvider";

// Màn AWING Location Network, theo đúng markup trang mẫu Figma
// (file HTML tran gửi, 18/11/2026): dải tiêu đề trắng + "← Home", dải số
// liệu chia cột (icon đỏ 15px, số Barlow Condensed), thẻ heatmap 10x15,
// hai biểu đồ Recharts (Engagement by Industry + Reach vs Engagement by
// City), thẻ Location Directory (hàng + chip lọc + nút sign-in).
// Số liệu đều lấy từ backend (SQLite). "Drill deeper", "Brand-level
// breakdown", bấm vào một địa điểm trong thư mục và "Sign in to view all"
// đều mở popup yêu cầu tài khoản advertiser (hành vi click trên Figma).

type PageState =
  | { status: "loading" }
  | { status: "ready"; stats: NetworkStats | null; coverage: CoverageResponse }
  | { status: "error"; message: string };

// Nhãn trục X của biểu đồ Reach vs Engagement lấy từ backend
// (cities[].short, theo locale của request) — không dịch cứng ở Frontend.

// Thứ tự chip lọc thư mục theo trang mẫu Figma.
const DIRECTORY_CATEGORIES = ["Retail", "F&B", "Transit", "Healthcare"];

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: 8,
  color: "#0d0d14",
  fontSize: 12,
  padding: 10,
};

function StatIcon({ kind }: { kind: "users" | "pin" | "building" | "zap" }) {
  const paths: Record<string, React.ReactNode> = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    building: (
      <>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </>
    ),
    zap: (
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    ),
  };
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-brand"
    >
      {paths[kind]}
    </svg>
  );
}

function PinIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LockIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function LocationsPage() {
  const { locale, t } = useLocale();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [category, setCategory] = useState<string | null>(null);
  const [authTitle, setAuthTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchNetworkStats(), fetchCoverage(locale)])
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
          message: err instanceof ApiError ? err.message : t("locations.loadFailed"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  const categories = useMemo(() => {
    if (state.status !== "ready" || !state.coverage.directory) return [];
    const present = new Set(state.coverage.directory.map((d) => d.category));
    return DIRECTORY_CATEGORIES.filter((c) => present.has(c));
  }, [state]);

  const directory = useMemo(() => {
    if (state.status !== "ready" || !state.coverage.directory) return [];
    if (!category) return state.coverage.directory;
    return state.coverage.directory.filter((d) => d.category === category);
  }, [state, category]);

  const industryChart = useMemo(() => {
    if (state.status !== "ready" || !state.coverage.industryStats) return [];
    return state.coverage.industryStats
      .filter((r) => r.impressions !== null && r.impressions !== undefined)
      .map((r) => ({ industry: r.industry, impressions: r.impressions as number }));
  }, [state]);

  const cityChart = useMemo(() => {
    if (state.status !== "ready" || !state.coverage.cities) return [];
    return state.coverage.cities
      .filter((c) => c.monthlyReach !== null && c.monthlyReach !== undefined)
      .map((c) => ({
        city: c.short ?? c.city,
        Reach: c.monthlyReach as number,
        Engagement: c.monthlyEngagements ?? 0,
      }));
  }, [state]);

  // Số hiển thị dạng gọn như trên trang mẫu Figma (25.4M, 10,953+).
  const formatCompact = (value: number | null, plus = false) => {
    if (value === null || value === undefined) return "—";
    const text = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value.toLocaleString("en-US");
    return plus ? `${text}+` : text;
  };

  const statsCells =
    state.status === "ready" && state.stats
      ? [
          { label: t("stats.connections"), icon: "users" as const, value: formatCompact(state.stats.connections) },
          { label: t("stats.provinces"), icon: "pin" as const, value: `${formatCompact(state.stats.provinces)}/63` },
          { label: t("stats.chains"), icon: "building" as const, value: `${formatCompact(state.stats.chains)}+` },
          { label: t("stats.venues"), icon: "zap" as const, value: formatCompact(state.stats.venues, true) },
        ]
      : [];

  return (
    <>
      <div className="border-b border-border bg-white py-8">
        <div className="mx-auto max-w-7xl px-6">
          <Link
            href="/"
            className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
          >
            ← Home
          </Link>
          <h1 className="mb-1 font-display text-4xl font-black text-ink">AWING LOCATION NETWORK</h1>
          <p className="text-sm text-muted">Real-time coverage across Vietnam · Updated daily</p>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="mx-auto max-w-7xl animate-pulse space-y-4 px-6 py-10" aria-label={t("locations.loading")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-border" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl border border-badge-border bg-badge-bg p-8 text-center">
            <p className="font-medium text-brand">{t("locations.loadFailed")}</p>
            <p className="mt-1 text-sm text-brand">{state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t("common.retry")}
            </button>
          </div>
        </div>
      )}

      {state.status === "ready" && (
        <>
          {statsCells.length > 0 && (
            <div className="border-b border-border">
              <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
                  {statsCells.map((cell) => (
                    <div key={cell.label} className="flex items-center gap-3 px-6 py-5">
                      <StatIcon kind={cell.icon} />
                      <div>
                        <div className="font-display text-xl leading-none font-black text-ink">
                          {cell.value}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">{cell.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
            <HeatmapCard
              provinces={state.coverage.provinces}
              onDrillDeeper={() => setAuthTitle("Drill deeper into location data")}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="mb-1 font-bold text-ink">Engagement by Industry</h3>
                <p className="mb-6 text-xs text-muted">
                  Total impressions (thousands) by vertical · last 30 days
                </p>
                {industryChart.length === 0 ? (
                  <p className="text-sm text-muted">{t("locations.noIndustry")}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={industryChart} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <XAxis
                        type="number"
                        domain={[0, (dataMax: number) => Math.max(4000, dataMax)]}
                        ticks={[0, 1000, 2000, 3000, 4000]}
                        tick={{ fontSize: 11, fill: "rgba(0,0,0,0.3)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="industry"
                        width={108}
                        tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                      <Bar dataKey="impressions" barSize={22} radius={[0, 4, 4, 0]}>
                        {industryChart.map((_, i) => (
                          <Cell key={i} fill={`rgba(232,33,43,${0.35 + i * 0.08125})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="mb-1 font-bold text-ink">Reach vs Engagement by City</h3>
                <p className="mb-6 text-xs text-muted">Monthly average in millions</p>
                {cityChart.length === 0 ? (
                  <p className="text-sm text-muted">{t("locations.noCities")}</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={cityChart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis
                          dataKey="city"
                          tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 16]}
                          ticks={[0, 4, 8, 12, 16]}
                          tick={{ fontSize: 11, fill: "rgba(0,0,0,0.3)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                        <Bar dataKey="Reach" fill="rgba(232,33,43,0.28)" barSize={30} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Engagement" fill="#E8212B" barSize={30} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <button
                      type="button"
                      onClick={() => setAuthTitle("Brand-level breakdown")}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted/30 transition-colors hover:text-brand"
                    >
                      <LockIcon size={10} />
                      Brand-level breakdown requires advertiser login
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-bold text-ink">Location Directory</h3>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-pressed={category === null}
                    onClick={() => setCategory(null)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      category === null ? "bg-brand text-white" : "bg-page text-muted hover:text-ink"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={category === c}
                      onClick={() => setCategory(c)}
                      className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        category === c ? "bg-brand text-white" : "bg-page text-muted hover:text-ink"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {directory.length === 0 ? (
                <p className="text-sm text-muted">{t("locations.noDirectory")}</p>
              ) : (
                <>
                  <div className="space-y-0.5">
                    {directory.map((entry) => (
                      <button
                        key={entry.name}
                        type="button"
                        onClick={() => setAuthTitle(`View details for ${entry.name}`)}
                        className="group -mx-2 flex w-full items-center justify-between rounded px-2 py-3 text-left transition-colors hover:bg-black/2"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: "rgba(232, 33, 43, 0.08)" }}
                          >
                            <PinIcon />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-ink">{entry.name}</div>
                            <div className="text-xs text-muted/50">{entry.subtitle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <div className="text-xs text-muted">{entry.locations} locations</div>
                            <div className="font-display text-sm font-black text-brand">
                              {entry.reach === null ? "—" : `${entry.reach}M`}
                            </div>
                          </div>
                          <LockIcon className="text-muted/15 transition-colors group-hover:text-brand" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthTitle("Sign in to view all locations")}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted/40 transition-colors hover:border-brand/30 hover:text-brand"
                  >
                    <LockIcon size={13} />
                    Sign in to view all{" "}
                    {state.stats?.venues ? `${formatCompact(state.stats.venues, true)} locations` : "locations"}
                  </button>
                </>
              )}
            </div>
          </main>
        </>
      )}

      {authTitle && <AdvertiserAuthModal title={authTitle} onClose={() => setAuthTitle(null)} />}
    </>
  );
}
