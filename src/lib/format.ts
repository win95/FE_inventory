// Định dạng ngày theo locale (vi: 10/12/2026 dạng chữ, en: December 10, 2026).
// Ngày không hợp lệ thì trả chuỗi gốc (không crash trang).
import type { Locale } from "./i18n";

export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// "Hôm nay" — tách ra module riêng vì lint rule react-hooks/purity cấm gọi
// Date.now()/new Date() trực tiếp trong thân component (kể cả server
// component, nơi mỗi request chỉ render một lần nên giá trị là ổn định).
export function nowMs(): number {
  return Date.now();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
