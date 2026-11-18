"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, fetchCaseStudies, fetchSuggest, isEmptySuggest, subscribeNetworkStats } from "@/lib/api";
import type { AdFormat, CaseStudy, LoadState, SuggestResponse } from "@/lib/types";
import { AdFormatCard, CaseStudyCard } from "@/components/ResultCards";
import AdvertiserAuthModal from "@/components/AdvertiserAuthModal";
import FormatPreviewModal from "@/components/FormatPreviewModal";
import { useLocale } from "@/components/LocaleProvider";

// Trang kết quả Advertisers — khớp đúng trang mẫu Figma (đo lại 18/11/2026):
// - Desktop rộng: 2 CỘT — trái Suggested Locations + Suggested Ad Formats,
//   phải Case Studies (cùng cao độ với Locations). Màn hẹp: 1 cột xếp dọc.
// - KHÔNG có tiêu đề h1, KHÔNG có khối Campaign Overview, KHÔNG có thẻ
//   venue từng địa điểm (đã bỏ theo quyết định "khớp Figma hoàn toàn" của
//   tran, 21:43 +07 18/11).
// - Prompt bar: "← Home" + ô tìm kiếm hiện prompt + Edit + nút đỏ Share/Save.
//   Edit → ô nhập + Update; Update mà query không đổi thì ở yên chế độ sửa.
// - Chip thành phố: chỉ chip ĐÃ CHỌN mới hiện số (= monthly engagements,
//   vd. 8.7M); chip chưa chọn chỉ hiện tên. Mặc định chọn top 3 theo
//   monthly engagements (HCMC 8.7 / Ha Noi 5.2 / Da Nang 1.8 → tổng
//   22.8M / 15.7M / 4.7M đúng Figma). Bật/tắt chip đổi 3 ô tổng.
// - Formats: 4 thẻ (Bumper Ads, Banner/Slide, Text Matching, Video Full
//   Screen), mỗi thẻ có mô tả + "Engagement xx%".
// - Case Studies ở cột phải, thẻ có banner + headline stat đỏ + mô tả;
//   nội dung lấy từ Strapi (chưa publish thì hiện trạng thái rỗng).
// - Share/Save, Drill down, Create custom format, xem case study đầy đủ:
//   mở popup yêu cầu tài khoản advertiser. Footer ẩn ở trang này (Figma
//   không có footer trên màn kết quả).
// Mọi đường vào đều qua prompt thật của người dùng (query ?prompt=...):
// trang gọi POST /api/suggest rồi hiển thị từ SQLite.

function formatMillions(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${(value / 1_000_000).toFixed(1)}M`;
}

/** Số liệu tháng đã ở đơn vị triệu (như trong DB) — hiện trực tiếp "8.7M". */
function formatMonthly(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}M`;
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function ShareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function LockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AdvertisersContent({ prompt }: { prompt: string }) {
  const router = useRouter();
  const { locale, t } = useLocale();
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
    fetchSuggest(prompt, locale)
      .then((data) => {
        if (cancelled) return;
        if (isEmptySuggest(data)) setState({ status: "empty" });
        else {
          setState({ status: "ready", data });
          if (data.cities) {
            // Mặc định chọn top 3 theo monthly engagements (đúng Figma).
            // Chỉ khởi tạo một lần cho prompt này: đổi locale hoặc refresh
            // số liệu realtime gọi lại fetch thì GIỮ NGUYÊN lựa chọn của
            // người dùng, không reset về top 3.
            const ranked = [...data.cities]
              .filter((c) => c.monthlyEngagements !== null && c.monthlyEngagements !== undefined)
              .sort((a, b) => (b.monthlyEngagements ?? 0) - (a.monthlyEngagements ?? 0));
            setSelectedCities((prev) => {
              if (prev !== null) return prev;
              return new Set(ranked.slice(0, 3).map((c) => c.name));
            });
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof ApiError ? err.message : t("adv.loadFailedFallback"),
          });
        }
      });
    fetchCaseStudies(locale)
      .then((data) => {
        if (!cancelled) setStudies(data);
      })
      .catch(() => {
        // Case study là khối phụ: lỗi thì chỉ ẩn khối này, không chặn kết quả chính.
      });
    return () => {
      cancelled = true;
    };
  }, [prompt, hasPrompt, locale, t]);

  // Số liệu tăng dần theo thời gian thực: mỗi khi backend đẩy snapshot SSE
  // mới (mỗi chu kỳ 30s, số vừa được cộng dồn trong DB), gọi lại /api/suggest
  // để lấy số thành phố mới — 3 ô tổng + số trên chip tự nhảy theo, lựa chọn
  // chip của người dùng được giữ nguyên (không reset về top 3). Lần gọi lại
  // gửi logPrompt: false nên không ghi trùng prompt vào prompt_logs.
  useEffect(() => {
    if (!hasPrompt || state.status !== "ready") return;
    const unsubscribe = subscribeNetworkStats(
      () => {
        fetchSuggest(prompt, locale, { logPrompt: false })
          .then((data) => {
            if (!isEmptySuggest(data)) setState({ status: "ready", data });
          })
          .catch(() => {
            // Refresh lỗi thì giữ số cũ, kỳ SSE sau thử lại.
          });
      },
      () => {},
      locale,
    );
    return unsubscribe;
  }, [prompt, hasPrompt, locale, state.status]);

  const cityTotals = useMemo(() => {
    if (state.status !== "ready" || !state.data.cities || !selectedCities) return null;
    const chosen = state.data.cities.filter((c) => selectedCities.has(c.name));
    const sum = (pick: (c: (typeof chosen)[number]) => number | null | undefined) =>
      chosen.reduce<number | null>((acc, c) => {
        const v = pick(c);
        if (v === null || v === undefined) return acc;
        return (acc ?? 0) + v;
      }, null);
    return {
      count: chosen.length,
      reach: sum((c) => c.reach),
      engagements: sum((c) => c.monthlyEngagements),
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
      {editing ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="shrink-0 text-sm text-muted hover:text-ink">
            {t("common.backHome")}
          </Link>
          <form onSubmit={resubmit} className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
            <label htmlFor="edit-prompt" className="sr-only">{t("adv.editLabel")}</label>
            <input
              id="edit-prompt"
              name="edit-prompt"
              type="text"
              defaultValue={prompt}
              placeholder={t("hero.promptPlaceholder")}
              className="h-12 min-w-0 flex-1 rounded-lg border border-outline bg-white px-5 text-ink outline-none placeholder:text-muted focus:border-brand"
            />
            <button type="submit"
              className="h-12 shrink-0 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark">
              {t("adv.update")}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="h-12 shrink-0 rounded-lg border border-outline px-6 font-medium text-muted hover:border-muted">
              {t("adv.cancel")}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0 text-sm text-muted hover:text-ink">
            {t("common.backHome")}
          </Link>
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-lg border border-outline bg-white px-4">
            <span className="shrink-0 text-muted">
              <SearchIcon />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{prompt}</span>
            {prompt && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted hover:text-ink"
              >
                <PencilIcon />
                {t("adv.edit")}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAuthTitle(t("adv.modalShare"))}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <ShareIcon />
            {t("adv.shareSave")}
          </button>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {hasPrompt && state.status === "loading" && (
            <div className="animate-pulse space-y-4" aria-label={t("adv.loadingResults")}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-border" />
              ))}
            </div>
          )}

          {(!hasPrompt || state.status === "empty") && (
            <div className="rounded-2xl border border-dashed border-outline p-8 text-center">
              <p className="font-medium text-muted">
                {!prompt.trim() ? t("adv.noPrompt") : t("adv.noResult")}
              </p>
              <p className="mt-1 text-sm text-muted">
                {!prompt.trim() ? t("adv.noPromptHint") : t("adv.noResultHint")}
              </p>
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-2xl border border-badge-border bg-badge-bg p-8 text-center">
              <p className="font-medium text-brand">{t("adv.loadFailed")}</p>
              <p className="mt-1 text-sm text-brand">{state.message}</p>
              <button type="button" onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                {t("common.retry")}
              </button>
            </div>
          )}

          {state.status === "ready" && (
            <>
              {state.data.cities && state.data.cities.length > 0 && selectedCities && (
                <section aria-label={t("a11y.selectedCities")}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-xl font-bold text-ink">{t("adv.locationsTitle")}</h2>
                    {cityTotals && (
                      <p className="text-sm text-muted">
                        {t("adv.citiesSelected", { count: String(cityTotals.count) })}
                      </p>
                    )}
                  </div>
                  {cityTotals && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-border bg-white p-4">
                        <p className="text-sm text-muted">{t("adv.totalReach")}</p>
                        <p className="mt-1 text-2xl font-bold text-ink">{formatMillions(cityTotals.reach)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-white p-4">
                        <p className="text-sm text-muted">{t("adv.potentialEngagements")}</p>
                        <p className="mt-1 text-2xl font-bold text-brand">{formatMonthly(cityTotals.engagements)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-white p-4">
                        <p className="text-sm text-muted">{t("adv.impressionsPerDay")}</p>
                        <p className="mt-1 text-2xl font-bold text-ink">{formatMillions(cityTotals.impressions)}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {state.data.cities.map((city) => {
                      const active = selectedCities.has(city.name);
                      const monthly = city.monthlyEngagements ?? null;
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
                          <PinIcon />
                          {city.name}
                          {active && monthly !== null && (
                            <span className="font-semibold text-brand">{formatMonthly(monthly)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthTitle(t("adv.modalDrill"))}
                    className="mt-3 flex items-center gap-1.5 text-sm text-muted hover:text-brand"
                  >
                    <LockIcon />
                    {t("adv.drillDownNote")}
                  </button>
                </section>
              )}

              <section aria-label={t("a11y.suggestedFormats")}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-ink">{t("adv.formatsTitle")}</h2>
                  <button
                    type="button"
                    onClick={() => setAuthTitle(t("adv.modalCustom"))}
                    className="text-sm font-medium text-brand hover:text-brand-dark"
                  >
                    {t("adv.createFormat")}
                  </button>
                </div>
                {state.data.formats.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">{t("adv.noFormats")}</p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {state.data.formats.map((format) => (
                      <AdFormatCard key={format.name} format={format} onPreview={() => setPreviewFormat(format)} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="lg:col-span-1">
          <section aria-label="Case Studies">
            <h2 className="text-xl font-bold text-ink">{t("adv.studiesTitle")}</h2>
            {studies.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("adv.noStudies")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {studies.map((study) => (
                  <CaseStudyCard
                    key={study.title}
                    study={study}
                    onRequestAccess={() => setAuthTitle(t("adv.modalStudy", { name: study.title }))}
                  />
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

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
  const { t } = useLocale();
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><p className="text-muted">{t("common.loading")}</p></main>}>
      <AdvertisersShell />
    </Suspense>
  );
}
