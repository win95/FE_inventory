"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchNetworkStats, subscribeNetworkStats } from "@/lib/api";
import type { LoadState, NetworkStats } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

// Dải số liệu tin cậy (F03), theo đúng trang mẫu Figma: dải trắng phẳng,
// mỗi mục có icon đỏ trên nền hồng nhạt, số đen in đậm, nhãn xám.
// Số hiển thị dạng gọn như trên mẫu (25.4M, 63/63, 195+, 10,953).
// Dữ liệu chỉ đến từ API backend (SQLite). Database rỗng → trạng thái rỗng,
// không tự điền số. Realtime: nhận snapshot đầy đủ qua SSE; mất SSE thì
// polling mỗi 60 giây (trễ 1 phút được chấp nhận theo quyết định của
// tran ~12:55 +07, 18/11).
function formatCompact(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return value.toLocaleString("en-US");
}

// Lượt kết nối hiển thị số nguyên đầy đủ (25400000) theo yêu cầu của tran
// 23:00 +07 18/11 — không rút gọn dạng 25.4M như các ô khác.
function formatInteger(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return String(Math.trunc(value));
}

const ICONS: Record<string, React.ReactNode> = {
  users: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" strokeLinecap="round" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15.3c2 .6 3.5 2.1 4 4.7" strokeLinecap="round" />
    </svg>
  ),
  pin: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  chain: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 21h18M5 21V8l7-5 7 5v13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bolt: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
    </svg>
  ),
};

export default function StatsStrip() {
  const { locale, t } = useLocale();
  const [state, setState] = useState<LoadState<NetworkStats>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const apply = (data: NetworkStats | null) => {
      if (cancelled) return;
      if (!data) setState({ status: "empty" });
      else setState({ status: "ready", data });
    };
    const fail = (message: string) => {
      if (!cancelled) setState({ status: "error", message });
    };
    // Tải lần đầu ngay, sau đó SSE/polling giữ số liệu tươi.
    fetchNetworkStats()
      .then(apply)
      .catch((err: unknown) =>
        fail(err instanceof ApiError ? err.message : t("api.statsFailed")),
      );
    const unsubscribe = subscribeNetworkStats(apply, fail, locale);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [locale, t]);

  const cells: { label: string; icon: string; value: (data: NetworkStats) => string }[] = [
    { label: t("stats.connections"), icon: "users", value: (d) => formatInteger(d.connections) },
    { label: t("stats.provinces"), icon: "pin", value: (d) => `${formatCompact(d.provinces)}/63` },
    { label: t("stats.chains"), icon: "chain", value: (d) => `${formatCompact(d.chains)}+` },
    { label: t("stats.venues"), icon: "bolt", value: (d) => formatCompact(d.venues) },
  ];

  if (state.status === "loading") {
    return (
      <section aria-label={t("a11y.networkStats")} className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cells.map((cell) => (
              <div key={cell.label} className="flex animate-pulse items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-page" />
                <div>
                  <div className="h-6 w-20 rounded bg-page" />
                  <div className="mt-1.5 h-4 w-24 rounded bg-page" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (state.status === "empty" || state.status === "no-backend") {
    return (
      <section aria-label={t("a11y.networkStats")} className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-dashed border-outline p-6 text-center">
            <p className="font-medium text-ink">{t("stats.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted">
              {state.status === "no-backend" ? t("stats.noBackend") : t("stats.emptyDb")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section aria-label={t("a11y.networkStats")} className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-badge-border bg-badge-bg p-6 text-center">
            <p className="font-medium text-brand">{t("stats.errorTitle")}</p>
            <p className="mt-1 text-sm text-brand/80">{state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t("common.retry")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={t("a11y.networkStats")} className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-0 lg:divide-x lg:divide-divider">
          {cells.map((cell) => (
            <div key={cell.label} className="flex flex-1 items-center gap-3 lg:px-6 lg:first:pl-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tile text-brand">
                {ICONS[cell.icon]}
              </span>
              <span>
                <span className="block font-display text-2xl font-bold text-ink">
                  {cell.value(state.data)}
                </span>
                <span className="mt-0.5 block text-sm text-muted">{cell.label}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          {t("stats.realtimeNote")}
        </p>
        <div className="mt-4 flex justify-center">
          <Link href="/locations" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            {t("stats.explore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
