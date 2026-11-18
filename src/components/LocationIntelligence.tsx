"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchCoverage } from "@/lib/api";
import type { CoverageLevel, CoverageResponse, LoadState } from "@/lib/types";

// Location Intelligence + bản đồ nhiệt (F04), theo đúng trang mẫu Figma:
// eyebrow đỏ in hoa, tiêu đề Barlow Condensed Black in hoa, thẻ mini trắng
// số đỏ, nút Explore đỏ, thẻ heatmap trắng với thang Low–High 5 nấc đỏ.
// Bản đồ vẽ từ dữ liệu phủ sóng backend trả về (theo tỉnh + theo loại venue,
// lưu trong SQLite). Chưa có dữ liệu hình học tỉnh/thành trong SQLite nên
// bản đồ địa lý đầy đủ là việc của giai đoạn sau; trước mắt hiển thị mức phủ
// sóng từng tỉnh dạng thanh màu theo thang Low–High, đổi màu theo đúng mật
// độ trong database. Không ghi cứng con số nào: database rỗng thì hiện trạng
// thái rỗng.
const LEVEL_STYLE: Record<CoverageLevel, { label: string; bar: string; text: string }> = {
  low: { label: "Thấp", bar: "bg-heat-1", text: "text-muted" },
  medium: { label: "Trung bình", bar: "bg-heat-3", text: "text-muted" },
  high: { label: "Cao", bar: "bg-heat-5", text: "text-brand" },
};

const HEAT_SCALE = ["bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4", "bg-heat-5"];

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
    <section aria-label="Location Intelligence" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-widest text-brand uppercase">Location Intelligence</p>
      <h2 className="mt-2 max-w-xl font-display text-4xl leading-[0.95] font-black tracking-tight text-ink uppercase sm:text-5xl">
        Reach users where they actually are
      </h2>
      <p className="mt-3 max-w-2xl text-muted">
        Mức phủ sóng theo tỉnh/thành và theo loại địa điểm, lấy trực tiếp từ
        database qua API — thay đổi dữ liệu trong SQLite thì bản đồ đổi theo.
      </p>

      {state.status === "loading" && (
        <div className="mt-8 animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-border" />
          ))}
        </div>
      )}

      {state.status === "empty" && (
        <div className="mt-8 rounded-2xl border border-dashed border-outline bg-white p-6 text-center">
          <p className="font-medium text-ink">Chưa có dữ liệu phủ sóng</p>
          <p className="mt-1 text-sm text-muted">
            Thêm tỉnh/thành và số điểm theo loại venue vào SQLite thì bản đồ nhiệt sẽ hiện ở đây.
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-8 rounded-2xl border border-badge-border bg-badge-bg p-6 text-center">
          <p className="font-medium text-brand">Không tải được dữ liệu phủ sóng</p>
          <p className="mt-1 text-sm text-brand/80">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Thử lại
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

          <div className="mt-8 rounded-2xl border border-border bg-white p-6">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">
              Coverage Heatmap · Vietnam
            </p>
            <ul className="mt-5 space-y-3">
              {state.data.provinces.map((row) => (
                <li key={row.province} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm font-medium text-ink">
                    {row.province}
                  </span>
                  <span className="h-3 flex-1 overflow-hidden rounded-lg bg-page">
                    <span className={`block h-full ${LEVEL_STYLE[row.level].bar}`} style={{ width: "100%" }} />
                  </span>
                  <span className={`w-28 shrink-0 text-right text-sm ${LEVEL_STYLE[row.level].text}`}>
                    {LEVEL_STYLE[row.level].label} · {row.venues.toLocaleString("en-US")} điểm
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted">
              <span>Low</span>
              {HEAT_SCALE.map((swatch) => (
                <span key={swatch} className={`inline-block h-3 w-8 rounded-sm ${swatch}`} />
              ))}
              <span>High</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
