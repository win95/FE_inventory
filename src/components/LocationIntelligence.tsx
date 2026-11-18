"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchCoverage } from "@/lib/api";
import type { CoverageLevel, CoverageResponse, LoadState } from "@/lib/types";

// Location Intelligence + bản đồ nhiệt (F04). Bản đồ vẽ từ dữ liệu phủ sóng
// backend trả về (theo tỉnh + theo loại venue, lưu trong SQLite).
// Chưa có dữ liệu hình học tỉnh/thành trong SQLite nên bản đồ địa lý đầy đủ
// là việc của giai đoạn sau; trước mắt hiển thị mức phủ sóng từng tỉnh dạng
// thanh màu theo thang Low–High, đổi màu theo đúng mật độ trong database.
// Không ghi cứng con số nào: database rỗng thì hiện trạng thái rỗng.
const LEVEL_STYLE: Record<CoverageLevel, { label: string; bar: string; text: string }> = {
  low: { label: "Thấp", bar: "bg-amber-300", text: "text-amber-700 dark:text-amber-400" },
  medium: { label: "Trung bình", bar: "bg-orange-400", text: "text-orange-700 dark:text-orange-400" },
  high: { label: "Cao", bar: "bg-red-600", text: "text-red-700 dark:text-red-400" },
};

export default function LocationIntelligence({ showExploreLink = true }: { showExploreLink?: boolean }) {
  const [state, setState] = useState<LoadState<CoverageResponse>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchCoverage()
      .then((data) => {
        if (cancelled) return;
        if (!data || data.provinces.length === 0) setState({ status: "empty" });
        else setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof ApiError ? err.message : "Không tải được dữ liệu phủ sóng.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="Location Intelligence" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        Reach users where they actually are
      </h2>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Mức phủ sóng theo tỉnh/thành và theo loại địa điểm, lấy trực tiếp từ
        database qua API — thay đổi dữ liệu trong SQLite thì bản đồ đổi theo.
      </p>

      {state.status === "loading" && (
        <div className="mt-6 animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      )}

      {state.status === "empty" && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="font-medium text-zinc-700 dark:text-zinc-200">Chưa có dữ liệu phủ sóng</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Thêm tỉnh/thành và số điểm theo loại venue vào SQLite thì bản đồ nhiệt sẽ hiện ở đây.
          </p>
        </div>
      )}

      {showExploreLink && (
        <Link href="/locations" className="mt-6 inline-block rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200">
          Explore Full Location Network →
        </Link>
      )}

      {state.status === "error" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
          <p className="font-medium text-red-700 dark:text-red-300">Không tải được dữ liệu phủ sóng</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Thang phủ sóng:</span>
            {(Object.keys(LEVEL_STYLE) as CoverageLevel[]).map((level) => (
              <span key={level} className="flex items-center gap-1">
                <span className={`inline-block h-3 w-3 rounded-sm ${LEVEL_STYLE[level].bar}`} />
                {LEVEL_STYLE[level].label}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {state.data.provinces.map((row) => (
              <li key={row.province} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {row.province}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <span className={`block h-full ${LEVEL_STYLE[row.level].bar}`} style={{ width: "100%" }} />
                </span>
                <span className={`w-24 shrink-0 text-right text-sm ${LEVEL_STYLE[row.level].text}`}>
                  {LEVEL_STYLE[row.level].label} · {row.venues.toLocaleString("vi-VN")} điểm
                </span>
              </li>
            ))}
          </ul>
          {state.data.venueTypes.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {state.data.venueTypes.map((venue) => (
                <div key={venue.type} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                    {venue.count.toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{venue.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
