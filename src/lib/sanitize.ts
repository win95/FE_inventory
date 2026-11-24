// Sanitize HTML từ CMS (FE 11) — dùng DOMPurify, chỉ chạy ở client.
// Dùng khi nào: block rich-text / nội dung Strapi render HTML (R1-3/R1-4).
// Hiện tại block rich-text chỉ nhận plain text nên chưa cần gọi — helper này
// sẵn cho lúc đó. Không tự viết sanitize bằng regex: dễ lọt XSS.
import DOMPurify from "dompurify";

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
}
