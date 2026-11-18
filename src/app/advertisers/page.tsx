"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, fetchCaseStudies, fetchSuggest, isEmptySuggest } from "@/lib/api";
import type { AdFormat, CaseStudy, LoadState, SuggestResponse } from "@/lib/types";
import { AdFormatCard, CaseStudyCard, LocationCard } from "@/components/ResultCards";
import AdvertiserAuthModal from "@/components/AdvertiserAuthModal";
import FormatPreviewModal from "@/components/FormatPreviewModal";

// Trang kết quả tìm kiếm / Advertisers (F06–F09 + F14), khớp hành vi click
// trên Figma đã khám phá (~14:03 +07, 18/11):
// - KHÔNG có tab Top performing / Highest reach / Premium — đã bỏ.
// - Chip thành phố bật/tắt làm đổi tổng Reach/Engagements/Impressions.
// - Query hiện dạng text + nút Edit; bấm Edit mới thành ô nhập + nút Update;
//   Update mà query không đổi thì ở yên chế độ sửa, không làm gì.
// - Share/Save, Drill down, Create custom format, xem case study đầy đủ:
//   mở popup yêu cầu tài khoản advertiser.
// - Thẻ ad format bấm vào mở popup xem trước trên điện thoại.
// Mọi đường vào đều qua prompt thật của người dùng (query ?prompt=...):
// trang gọi POST /api/suggest rồi hiển thị từ SQLite. Không có prompt thì
// hiện trạng thái rỗng + link về Home.

function formatMillions(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function AdvertisersContent({ prompt }: { prompt: string }) {
  const router = useRouter();
  const hasPrompt = prompt.trim().length > 0;
  const [state, setState] = useState<LoadState<SuggestResponse>>({ status: "loading" });
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [editing, setEditing] = useState(false);
  const [selectedCities, setSelectedCities] = useState<Set<string> | null>(null);
  const [authTitle, setAuthTitle] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<AdFormat | null>(null);

  useEffect(() => {
    if (!hasPrompt) return;
    let cancelled = false;
    fetchSuggest(prompt)
      .then((data) => {
        if (cancelled) return;
        if (isEmptySuggest(data)) setState({ status: "empty" });
        else {
          setState({ status: "ready", data });
          if (data.cities) setSelectedCities(new Set(data.cities.map((c) => c.name)));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof ApiError ? err.message : "Không tải được kết quả gợi ý.",
          });
        }
      });
    fetchCaseStudies()
      .then((data) => {
        if (!cancelled) setStudies(data);
      })
      .catch(() => {
        // Case study là khối phụ: lỗi thì chỉ ẩn khối này, không chặn kết quả chính.
      });
    return () => {
      cancelled = true;
    };
  }, [prompt, hasPrompt]);

  const cityTotals = useMemo(() => {
    if (state.status !== "ready" || !state.data.cities || !selectedCities) return null;
    const chosen = state.data.cities.filter((c) => selectedCities.has(c.name));
    const sum = (pick: (c: (typeof chosen)[number]) => number | null) =>
      chosen.reduce<number | null>((acc, c) => {
        const v = pick(c);
        if (v === null) return acc;
        return (acc ?? 0) + v;
      }, null);
    return {
      count: chosen.length,
      reach: sum((c) => c.reach),
      engagements: sum((c) => c.engagements),
      impressions: sum((c) => c.impressionsPerDay),
    };
  }, [state, selectedCities]);

  const resubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("edit-prompt") ?? "").trim();
    if (!value) return;
    // Update mà query không đổi thì ở yên chế độ sửa, như trên Figma.
    if (value === prompt) return;
    router.push(`/advertisers?prompt=${encodeURIComponent(value)}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Kết quả gợi ý chiến dịch
        </h1>
        <Link href="/" className="rounded-lg border border-outline px-4 py-2 text-sm font-medium text-muted hover:border-muted">
          ← Home
        </Link>
      </div>

      {editing ? (
        <form onSubmit={resubmit} className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <label htmlFor="edit-prompt" className="sr-only">Sửa ý tưởng chiến dịch</label>
          <input
            id="edit-prompt"
            name="edit-prompt"
            type="text"
            defaultValue={prompt}
            placeholder="Nhập ý tưởng cho chiến dịch…"
            className="h-12 flex-1 rounded-lg border border-outline bg-white px-5 text-ink outline-none placeholder:text-muted focus:border-brand"
          />
          <button type="submit"
            className="h-12 shrink-0 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark">
            Update
          </button>
          <button type="button" onClick={() => setEditing(false)}
            className="h-12 shrink-0 rounded-lg border border-outline px-6 font-medium text-muted hover:border-muted">
            Hủy
          </button>
        </form>
      ) : (
        prompt && (
          <p className="mt-6 text-base text-muted">
            <span className="font-medium">{prompt}</span>{" "}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ml-2 rounded-lg border border-outline px-3 py-1 text-sm font-medium text-muted hover:border-muted"
            >
              Edit
            </button>
          </p>
        )
      )}

      {hasPrompt && state.status === "loading" && (
        <div className="mt-10 animate-pulse space-y-4" aria-label="Đang tải kết quả">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-border" />
          ))}
        </div>
      )}

      {(!hasPrompt || state.status === "empty") && (
        <div className="mt-10 rounded-2xl border border-dashed border-outline p-8 text-center">
          <p className="font-medium text-muted">
            {!prompt.trim() ? "Chưa có prompt để gợi ý" : "Chưa có kết quả phù hợp"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {!prompt.trim()
              ? "Nhập ý tưởng chiến dịch ở trang chủ rồi bấm Get Suggestions."
              : "Backend chưa có địa điểm/format phù hợp với prompt này trong SQLite. Thử prompt khác, hoặc thêm dữ liệu vào database."}
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-10 rounded-2xl border border-badge-border bg-badge-bg p-8 text-center">
          <p className="font-medium text-brand">Không tải được kết quả gợi ý</p>
          <p className="mt-1 text-sm text-brand">{state.message}</p>
          <button type="button" onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Thử lại
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <section aria-label="Tổng quan chiến dịch" className="mt-10">
            <h2 className="text-xl font-bold text-ink">Campaign Overview</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                { label: "Địa điểm", value: String(state.data.overview.locations) },
                { label: "Venues", value: String(state.data.overview.venues) },
                { label: "Reach", value: state.data.overview.reach === null ? "—" : formatMillions(state.data.overview.reach) },
                { label: "Engagement", value: state.data.overview.engagement === null ? "—" : `${state.data.overview.engagement}%` },
                { label: "Off-Peak", value: state.data.overview.offPeak === null ? "—" : `${state.data.overview.offPeak}%` },
              ].map((cell) => (
                <div key={cell.label} className="rounded-xl border border-border bg-white p-4">
                  <p className="text-2xl font-bold text-ink">{cell.value}</p>
                  <p className="mt-1 text-sm text-muted">{cell.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAuthTitle("Save or share this campaign suggestion")}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Share / Save
              </button>
              <button
                type="button"
                onClick={() => setAuthTitle("Drill down to district/brand level")}
                className="rounded-lg border border-outline bg-white px-4 py-2 text-sm font-medium text-muted hover:border-muted"
              >
                Drill down to district/brand level
              </button>
            </div>
          </section>

          {state.data.cities && state.data.cities.length > 0 && selectedCities && (
            <section aria-label="Thành phố đã chọn" className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold text-ink">Suggested Locations</h2>
                {cityTotals && (
                  <p className="text-sm text-muted">{cityTotals.count} cities selected</p>
                )}
              </div>
              {cityTotals && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="text-sm text-muted">Total Reach</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{formatMillions(cityTotals.reach)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="text-sm text-muted">Potential Engagements</p>
                    <p className="mt-1 text-2xl font-bold text-brand">{formatMillions(cityTotals.engagements)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="text-sm text-muted">Est. Impressions/Day</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{formatMillions(cityTotals.impressions)}</p>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {state.data.cities.map((city) => {
                  const active = selectedCities.has(city.name);
                  return (
                    <button
                      key={city.name}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedCities((prev) => {
                          const next = new Set(prev ?? []);
                          if (next.has(city.name)) next.delete(city.name);
                          else next.add(city.name);
                          return next;
                        });
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                        active
                          ? "border border-chip-border bg-chip-bg font-medium text-ink"
                          : "border border-transparent bg-transparent text-muted hover:border-outline"
                      }`}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {city.name}
                      {city.reach !== null && (
                        <span className={active ? "font-semibold text-brand" : "text-muted"}>
                          {formatMillions(city.reach)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-muted">
                Drill down to district / brand level — requires advertiser login
              </p>
            </section>
          )}

          <section aria-label="Địa điểm gợi ý" className="mt-10">
            {!(state.data.cities && state.data.cities.length > 0 && selectedCities) && (
              <h2 className="text-xl font-bold text-ink">Suggested Locations</h2>
            )}
            {state.data.locations.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Chưa có địa điểm gợi ý cho prompt này.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {state.data.locations.map((loc) => (
                  <LocationCard key={`${loc.name}-${loc.city}`} location={loc} />
                ))}
              </div>
            )}
          </section>

          <section aria-label="Định dạng quảng cáo gợi ý" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">Suggested Ad Formats</h2>
              <button
                type="button"
                onClick={() => setAuthTitle("Create a customised ad format")}
                className="text-sm font-medium text-brand hover:text-brand-dark"
              >
                + Create custom format
              </button>
            </div>
            {state.data.formats.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Chưa có định dạng quảng cáo gợi ý cho prompt này.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {state.data.formats.map((format) => (
                  <AdFormatCard key={format.name} format={format} onPreview={() => setPreviewFormat(format)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section aria-label="Case Studies" className="mt-10">
        <h2 className="text-xl font-bold text-ink">Case Studies</h2>
        {studies.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Chưa có case study nào được đăng trên Strapi. Đăng bài Case Study trên Strapi và Publish thì lưới case study sẽ hiện ở đây.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studies.map((study) => (
              <CaseStudyCard
                key={study.title}
                study={study}
                onRequestAccess={() => setAuthTitle(`View the full ${study.title} case study`)}
              />
            ))}
          </div>
        )}
      </section>

      {authTitle && <AdvertiserAuthModal title={authTitle} onClose={() => setAuthTitle(null)} />}
      {previewFormat && <FormatPreviewModal format={previewFormat} onClose={() => setPreviewFormat(null)} />}
    </main>
  );
}

// useSearchParams bắt buộc phải nằm trong Suspense boundary (Next.js App Router).
// Shell đọc prompt rồi truyền xuống với key={prompt} để đổi prompt thì
// component gợi ý mount lại từ đầu (trạng thái loading mới, không cần đồng bộ state).
function AdvertisersShell() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") ?? "";
  return <AdvertisersContent key={prompt} prompt={prompt} />;
}

export default function AdvertisersPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><p className="text-muted">Đang tải…</p></main>}>
      <AdvertisersShell />
    </Suspense>
  );
}
