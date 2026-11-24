import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// FE 13 — bảng 301 đọc từ redirects.json (BA bổ sung đủ 572 URL sau).
interface RedirectEntry {
  source: string;
  destination: string;
  permanent: boolean;
}

function loadRedirects(): RedirectEntry[] {
  const file = join(process.cwd(), "redirects.json");
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as {
      redirects: RedirectEntry[];
    };
    return data.redirects ?? [];
  } catch (err) {
    // File thiếu thì coi như chưa có redirect; file có mà lỗi cú pháp thì
    // FAIL BUILD luôn — im lặng bỏ qua sẽ khiến 301 biến mất không ai biết.
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw err;
  }
}

// FE 11 — security headers (Docs §8.5). CSP phải cho phép:
// - 'unsafe-inline' cho script/style: Next.js chèn inline script lúc hydrate
//   + JSON-LD Organization/WebSite là inline script; Tailwind cần inline style.
// - connect-src tới origin của FastAPI + Strapi (đọc từ env lúc build/chạy;
//   dev không có env thì thêm localhost). Không có origin thì fetch/SSE sang
//   backend sẽ bị CSP chặn — kiểm tra bằng curl khi đổi env.
// - GTM chỉ thêm vào script-src khi đã cấu hình NEXT_PUBLIC_GTM_ID.
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function buildCsp(): string {
  const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL);
  const strapiOrigin = originOf(process.env.NEXT_PUBLIC_STRAPI_URL);
  const connectSrc = ["'self'", apiOrigin, strapiOrigin];
  if (process.env.NODE_ENV !== "production" && !apiOrigin && !strapiOrigin) {
    connectSrc.push("http://localhost:8000", "http://localhost:1337");
  }
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (process.env.NEXT_PUBLIC_GTM_ID) scriptSrc.push("https://www.googletagmanager.com");
  const imgSrc = ["'self'", "data:"];
  if (strapiOrigin) imgSrc.push(strapiOrigin);
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.filter(Boolean).join(" ")}`,
    // FE 50: bản đồ Google Maps nhúng trên /contact (iframe www.google.com).
    // Chỉ mở đúng origin này — không mở frame-src chung cho mọi site.
    "frame-src https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCsp() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS chỉ có tác dụng trên HTTPS; trình duyệt bỏ qua header này trên HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Output standalone để chạy trong Docker (xem Dockerfile): server Node
  // gọn nhẹ, chỉ cần .next/standalone + .next/static + public.
  output: "standalone",
  // BE 9 (tạm, R1): media Strapi local upload + next/image tối ưu
  // AVIF/WebP. Chưa có object storage/CDN riêng — khi có thì đổi
  // remotePatterns sang host CDN. Host Strapi đọc từ env lúc build/chạy.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: (() => {
      const origin = originOf(process.env.NEXT_PUBLIC_STRAPI_URL);
      if (!origin) return [];
      const url = new URL(origin);
      return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, port: url.port || undefined, pathname: "/uploads/**" }];
    })(),
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return loadRedirects();
  },
};

export default nextConfig;
