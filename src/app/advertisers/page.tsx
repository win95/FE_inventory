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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          Kết quả gợi ý chiến dịch
        </h1>
        <Link href="/" className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200">
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
            className="h-12 flex-1 rounded-full border border-zinc-300 bg-white px-5 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button type="submit"
            className="h-12 shrink-0 rounded-full bg-red-600 px-6 font-semibold text-white hover:bg-red-700">
            Update
          </button>
          <button type="button" onClick={() => setEditing(false)}
            className="h-12 shrink-0 rounded-full border border-zinc-300 px-6 font-medium text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300">
            Hủy
          </button>
        </form>
      ) : (
        prompt && (
          <p className="mt-6 text-base text-zinc-700 dark:text-zinc-200">
            <span className="font-medium">{prompt}</span>{" "}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ml-2 rounded-full border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            >
              Edit
            </button>
          </p>
        )
      )}

      {hasPrompt && state.status === "loading" && (
        <div className="mt-10 animate-pulse space-y-4" aria-label="Đang tải kết quả">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      )}

      {(!hasPrompt || state.status === "empty") && (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="font-medium text-zinc-700 dark:text-zinc-200">
            {!prompt.trim() ? "Chưa có prompt để gợi ý" : "Chưa có kết quả phù hợp"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {!prompt.trim()
              ? "Nhập ý tưởng chiến dịch ở trang chủ rồi bấm Get Suggestions."
              : "Backend chưa có địa điểm/format phù hợp với prompt này trong SQLite. Thử prompt khác, hoặc thêm dữ liệu vào database."}
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/40">
          <p className="font-medium text-red-700 dark:text-red-300">Không tải được kết quả gợi ý</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.message}</p>
          <button type="button" onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Thử lại
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <section aria-label="Tổng quan chiến dịch" className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Campaign Overview</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                { label: "Địa điểm", value: String(state.data.overview.locations) },
                { label: "Venues", value: String(state.data.overview.venues) },
                { label: "Reach", value: state.data.overview.reach === null ? "—" : formatMillions(state.data.overview.reach) },
                { label: "Engagement", value: state.data.overview.engagement === null ? "—" : `${state.data.overview.engagement}%` },
                { label: "Off-Peak", value: state.data.overview.offPeak === null ? "—" : `${state.data.overview.offPeak}%` },
              ].map((cell) => (
                <div key={cell.label} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{cell.value}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{cell.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAuthTitle("Save or share this campaign suggestion")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Share
              </button>
              <button
                type="button"
                onClick={() => setAuthTitle("Save or share this campaign suggestion")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAuthTitle("Drill down to district/brand level")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Drill down to district/brand level
              </button>
            </div>
          </section>

          {state.data.cities && state.data.cities.length > 0 && selectedCities && (
            <section aria-label="Thành phố đã chọn" className="mt-10">
              <div className="flex flex-wrap gap-2">
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
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        active
                          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                          : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
              {cityTotals && (
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {cityTotals.count} cities selected · Total Reach {formatMillions(cityTotals.reach)} ·{" "}
                  Potential Engagements {formatMillions(cityTotals.engagements)} · Est Impressions/Day{" "}
                  {formatMillions(cityTotals.impressions)}
                </p>
              )}
            </section>
          )}

          <section aria-label="Địa điểm gợi ý" className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Suggested Locations</h2>
            {state.data.locations.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">Chưa có địa điểm gợi ý cho prompt này.</p>
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
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Suggested Ad Formats</h2>
              <button
                type="button"
                onClick={() => setAuthTitle("Create a customised ad format")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Create custom format
              </button>
            </div>
            {state.data.formats.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">Chưa có định dạng quảng cáo gợi ý cho prompt này.</p>
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Case Studies</h2>
        {studies.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
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
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><p className="text-zinc-500">Đang tải…</p></main>}>
      <AdvertisersShell />
    </Suspense>
  );
}
