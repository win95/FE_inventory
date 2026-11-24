// Trang 404 theo locale: notFound() trong [locale] (kể cả đường dẫn không
// khớp route nào — xem [...rest]/page.tsx) hiện ở đây, có LocaleProvider
// nên chữ và link trang chủ theo đúng /vi hoặc /en. Trang 404 gốc
// (app/not-found.tsx) chỉ còn cho đường dẫn ngoài [locale].
"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";

export default function LocaleNotFound() {
  const { locale, t } = useLocale();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <title>{t("notFound.metaTitle")}</title>
      <p className="font-display text-6xl font-black text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-black text-ink">{t("notFound.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("notFound.description")}</p>
      <Link
        href={withLocale("/", locale)}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {t("notFound.home")}
      </Link>
    </main>
  );
}
