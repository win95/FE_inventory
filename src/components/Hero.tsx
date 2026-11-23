"use client";

import CampaignPromptForm from "./CampaignPromptForm";
import { useLocale } from "./LocaleProvider";

// Hero (F02), theo đúng trang mẫu Figma: nền phẳng #F5F6F8, badge hồng nhạt
// chữ đỏ, tiêu đề Be Vietnam Pro Black cỡ lớn in hoa (phần nhấn màu đỏ),
// mô tả xám #5B606B với cụm chính in đậm đen.
// Copy theo đúng những gì quan sát được trên Figma, không bịa thêm số liệu:
// hai con số trên trang mẫu (43 triệu người dùng ở Hero và 25.4M lượt kết
// nối ở dải số liệu) đang lệch nhau nên Hero không nhắc lại con số nào —
// chờ chốt ở mục 8 của Plan. Tiêu đề/mô tả dịch theo locale (bản EN lấy
// đúng copy gốc của Figma).
export default function Hero() {
  const { t } = useLocale();
  return (
    <section className="bg-page">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-badge-border bg-badge-bg px-3 py-1 text-xs font-semibold tracking-widest text-brand uppercase">
          <span aria-hidden="true">✦</span> {t("hero.eyebrow")}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-6xl leading-[1.08] font-black tracking-tight text-ink uppercase sm:text-7xl">
          {t("hero.titleA")}{" "}
          <span className="text-brand">{t("hero.titleB")}</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          {t("hero.subtitleA")}{" "}
          <span className="font-semibold text-ink">{t("hero.subtitleB")}</span>.
        </p>
        <CampaignPromptForm />
        <p className="mt-3 text-sm text-muted">{t("hero.example")}</p>
      </div>
    </section>
  );
}
