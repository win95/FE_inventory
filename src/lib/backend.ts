// Địa chỉ backend FastAPI — CHỈ phía server (route handler proxy
// /api/backend/* + server component). Không có tiền tố NEXT_PUBLIC_ nên
// không lọt vào bundle trình duyệt; trong trình duyệt module này trả "".
//
// Kiến trúc BFF: trình duyệt chỉ nói chuyện với Next.js; Next.js gọi các
// dịch vụ phía sau (FastAPI, Strapi). Trình duyệt gọi nghiệp vụ qua
// same-origin /api/backend/*, server gọi thẳng BACKEND_URL.
const raw =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL?.replace(/\/$/, "") ??
      // Tương thích ngược với .env cũ (NEXT_PUBLIC_API_BASE_URL) — bỏ khi
      // .env đã đổi sang BACKEND_URL.
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
      (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8000"))
    : "";

export const BACKEND_URL = raw;

export function isBackendConfigured(): boolean {
  return BACKEND_URL.length > 0;
}
