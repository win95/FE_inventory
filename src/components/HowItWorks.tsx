// How AWING Works — quy trình 3 bước (F05), theo đúng trang mẫu Figma:
// eyebrow + tiêu đề căn giữa (tiêu đề Be Vietnam Pro Black in hoa),
// thẻ trắng viền #E3E5EA, icon đỏ trên nền hồng nhạt góc trái, số thứ tự
// lớn màu xám nhạt #E3E5EA góc phải. Nội dung lấy đúng những gì quan sát
// được trên Figma; một số câu mô tả trên mẫu bị cắt ngắn nên không tự viết
// tiếp — chờ xin copy đầy đủ (mục 8 của Plan). Tiêu đề/mô tả 3 bước dịch
// theo locale (bản EN lấy đúng copy gốc của Figma).
"use client";

import { useLocale } from "./LocaleProvider";

const STEP_ICONS: React.ReactNode[] = [
  <svg key="chat" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" strokeLinejoin="round" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeLinecap="round" />
  </svg>,
  <svg key="pin" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>,
  <svg key="chart" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
  </svg>,
];

export default function HowItWorks({ steps }: { steps?: { title: string; description: string }[] }) {
  const { t } = useLocale();
  // R1-3: bước lấy từ Home single của Strapi khi có; không có thì giữ
  // copy tĩnh cũ (i18n) để trang không trống.
  const items = (steps && steps.length > 0
    ? steps.map((s, i) => ({ number: String(i + 1).padStart(2, "0"), title: s.title, description: s.description, icon: STEP_ICONS[i % STEP_ICONS.length] }))
    : [
        { number: "01", title: t("how.title1"), description: t("how.desc1"), icon: STEP_ICONS[0] },
        { number: "02", title: t("how.title2"), description: t("how.desc2"), icon: STEP_ICONS[1] },
        { number: "03", title: t("how.title3"), description: t("how.desc3"), icon: STEP_ICONS[2] },
      ]
  );

  return (
    <section aria-label={t("how.eyebrow")} className="bg-page">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-center text-xs font-semibold tracking-widest text-brand uppercase">{t("how.eyebrow")}</p>
        <h2 className="mx-auto mt-2 max-w-2xl text-center font-display text-3xl leading-[0.95] font-black tracking-tight text-ink uppercase sm:text-4xl">
          {t("how.title")}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((step) => (
            <article key={step.number} className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tile-soft text-brand">
                  {step.icon}
                </span>
                <span className="font-display text-3xl font-black text-stepnum">{step.number}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
