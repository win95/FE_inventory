"use client";

import Link from "next/link";
import type { AdFormat, CaseStudy } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import { withLocale } from "@/lib/i18n";
import CmsImage from "./CmsImage";


// Thẻ hiển thị cho trang kết quả Advertisers, theo đúng bố cục trang mẫu
// Figma (đo lại 18/11/2026, viewport desktop rộng + PDF):
// - Thẻ format: khối ảnh dọc 4:5, badge thời lượng góc trái, nút Play góc
//   phải, nút đỏ "TÌM HIỂU NGAY →" đè cuối ảnh; dưới ảnh: tên, mô tả,
//   hàng "Engagement xx%" (nhãn trái, số đỏ phải).
// - Thẻ case study: banner ảnh ngang, tên + ngành phủ trắng trên ảnh;
//   dưới: headline stat đỏ, mô tả, link xem đầy đủ.
// Ảnh creative thật chưa có (file ảnh nhị phân không push được qua snapshot)
// nên khối ảnh format dùng gradient giữ chỗ — thay bằng ảnh khi có asset.
// Bấm vào thẻ format mở popup xem trước; bấm thẻ case study mở popup yêu
// cầu tài khoản advertiser. Mọi thẻ chỉ nhận dữ liệu từ API, không tự bịa số.

function PlayIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function AdFormatCard({
  format,
  onPreview,
}: {
  format: AdFormat;
  onPreview: () => void;
}) {
  const { locale, t } = useLocale();
  return (
    <article className="rounded-2xl border border-border bg-white p-3">
      {/* Vùng xem trước là nút mở modal — không lồng Link bên trong (link
          trong button là interactive lồng interactive). Nút "Tìm hiểu ngay"
          đặt dưới thân thẻ, ngoài vùng bấm mở modal. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("modal.previewAria", { name: format.name })}
        onClick={onPreview}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPreview();
          }
        }}
        className="relative aspect-[4/5] cursor-pointer overflow-hidden rounded-xl bg-gradient-to-b from-brand/15 via-tile to-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {format.durationSeconds !== null && format.durationSeconds !== undefined && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
            {format.durationSeconds}s
          </span>
        )}
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
          <PlayIcon />
          {t("adv.play")}
        </span>
      </div>
      <div className="px-1 pb-1 pt-3">
        <h3 className="font-semibold text-ink">{format.name}</h3>
        {format.description && (
          <p className="mt-1 min-h-10 text-sm leading-5 text-muted">{format.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-divider pt-2.5">
          <span className="text-sm text-muted">{format.metricLabel}</span>
          <span className="text-sm font-bold text-brand">
            {format.metricValue === null ? "—" : `${format.metricValue}%`}
          </span>
        </div>
        <Link
          href={withLocale("/contact", locale)}
          className="mt-3 block rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t("adv.learnNow")}
        </Link>
      </div>
    </article>
  );
}

export function CaseStudyCard({
  study,
  onRequestAccess,
}: {
  study: CaseStudy;
  onRequestAccess: () => void;
}) {
  const { t } = useLocale();
  // Headline theo Figma: "+340% Brand Recall" — metricValue là % tăng,
  // metricLabel là tên chỉ số (quy ước nhập liệu trên Strapi, xem SETUP.md).
  const value =
    study.metricValue === null
      ? null
      : Number.isInteger(study.metricValue)
        ? String(study.metricValue)
        : study.metricValue.toFixed(1);
  const headline =
    value === null ? study.metricLabel : `+${value}% ${study.metricLabel}`;
  return (
    <button
      type="button"
      onClick={onRequestAccess}
      className="block w-full overflow-hidden rounded-2xl border border-border bg-white text-left hover:border-brand"
    >
      <div className="relative h-36">
        {study.coverUrl ? (
          // Ảnh CMS qua next/image (CmsImage): trình duyệt lấy ảnh qua
          // /_next/image của Next.js, không gọi thẳng Strapi.
          <CmsImage src={study.coverUrl} alt={study.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand/25 via-tile to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <p className="font-bold text-white">{study.title}</p>
          <p className="text-xs text-white/80">{study.industry}</p>
        </div>
      </div>
      <div className="p-4">
        {headline && <p className="font-bold text-brand">{headline}</p>}
        {study.summary && <p className="mt-1 text-sm leading-5 text-muted">{study.summary}</p>}
        <p className="mt-2 text-sm font-medium text-brand">{t("result.viewStudy")}</p>
      </div>
    </button>
  );
}
