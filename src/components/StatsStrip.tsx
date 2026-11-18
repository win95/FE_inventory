"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchNetworkStats, subscribeNetworkStats } from "@/lib/api";
import type { LoadState, NetworkStats } from "@/lib/types";

// Dải số liệu tin cậy (F03). Dữ liệu chỉ đến từ API backend (SQLite).
// Database rỗng → trạng thái rỗng, không tự điền số. Realtime: nhận snapshot
// đầy đủ qua SSE; mất SSE thì polling mỗi 60 giây (trễ 1 phút được chấp
// nhận theo quyết định của tran ~12:55 +07, 18/11).
function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("vi-VN");
}

export default function StatsStrip() {
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
        fail(err instanceof ApiError ? err.message : "Không tải được số liệu."),
      );
    const unsubscribe = subscribeNetworkStats(apply, fail);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const cells: { label: string; value: (data: NetworkStats) => string }[] = [
    { label: "Lượt kết nối", value: (d) => formatNumber(d.connections) },
    { label: "Tỉnh thành phố", value: (d) => `${formatNumber(d.provinces)}/63` },
    { label: "Chuỗi hệ thống", value: (d) => formatNumber(d.chains) },
    { label: "Địa điểm phủ sóng", value: (d) => formatNumber(d.venues) },
  ];

  if (state.status === "loading") {
    return (
      <section aria-label="Số liệu mạng lưới" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cells.map((cell) => (
            <div key={cell.label} className="animate-pulse rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
              <div className="h-8 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-900" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (state.status === "empty" || state.status === "no-backend") {
    return (
      <section aria-label="Số liệu mạng lưới" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="font-medium text-zinc-700 dark:text-zinc-200">Chưa có số liệu mạng lưới</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {state.status === "no-backend"
              ? "Chưa kết nối được backend — cấu hình NEXT_PUBLIC_API_BASE_URL và chạy backend FastAPI + SQLite."
              : "Database chưa có số liệu. Thêm bản ghi vào SQLite thì các ô số liệu sẽ hiện ở đây."}
          </p>
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section aria-label="Số liệu mạng lưới" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
          <p className="font-medium text-red-700 dark:text-red-300">Không tải được số liệu mạng lưới</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Số liệu mạng lưới" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {cell.value(state.data)}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{cell.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Số liệu cập nhật theo thời gian thực từ backend (trễ tối đa 1 phút).
      </p>
    </section>
  );
}
