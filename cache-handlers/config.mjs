// Cấu hình dùng chung cho cache handler (P0 K8s FE + cache).
//
// Next.js import các module này mà KHÔNG bundle ở runtime Node, nên viết
// bằng JS thuần (không TypeScript, không alias @/). NHƯNG lúc `next build`
// Turbopack vẫn biên dịch chúng cả vào bundle Edge Middleware (dù runtime
// thật không gọi handler từ middleware) — nên file này KHÔNG được dùng
// API mà Edge Runtime cấm: process.cwd() làm build lỗi (3 lỗi), còn
// import node:fs/node:path/node:crypto chỉ là warning. Vì vậy mọi đường
// dẫn file đều tính tương đối theo vị trí file này (import.meta.url),
// không theo cwd.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Thư mục chứa file handler (cache-handlers/) — gốc cho mọi đường dẫn
// file. Bố cục tương đối cache-handlers/ ↔ .next/ giữ nguyên cả khi chạy
// `next start` lẫn standalone (Dockerfile copy cả hai vào image).
const handlerDir = dirname(fileURLToPath(import.meta.url));
const dotNextDir = join(handlerDir, "..", ".next");

// Thư mục server của build (.next/server): chứa seed prerender — file
// route-cache build-time (.html/.rsc/.meta) mà handler số ít đọc khi
// Redis + disk đều miss (xem readRouteSeed trong multi-tier.mjs).
export const serverDir = join(dotNextDir, "server");

/**
 * BUILD_ID Next.js ghi lúc build (.next/BUILD_ID) — chính là giá trị
 * generateBuildId() trong next.config.ts trả về. Đọc file này để key
 * Redis khớp đúng build đang chạy, kể cả khi env GIT_SHA/IMAGE_TAG không
 * được truyền lúc chạy (vd. trong container chỉ có file build).
 * Thứ tự: file .next/BUILD_ID → env GIT_SHA → env IMAGE_TAG → "dev".
 * Lúc build local không có env thì cả file lẫn fallback đều là "dev",
 * nên build-time và runtime luôn khớp nhau.
 */
export function resolveBuildId() {
  const candidates = [
    join(dotNextDir, "BUILD_ID"),
    // Standalone (cũ): server.js chạy ở /app, file build nằm trong .next
    // của image — giữ lại để tương thích nếu bố cục copy thay đổi.
    join(dotNextDir, "standalone", ".next", "BUILD_ID"),
  ];
  for (const path of candidates) {
    try {
      const value = readFileSync(path, "utf8").trim();
      if (value) return value;
    } catch {
      // Chưa có file lúc build mới bắt đầu — thử nguồn tiếp theo.
    }
  }
  return process.env.GIT_SHA?.trim() || process.env.IMAGE_TAG?.trim() || "dev";
}

export const buildId = resolveBuildId();

// URL Redis: đọc thẳng PNCH_REDIS_URL (mặc định redis://localhost:6379
// của package). Chuỗi rỗng / disabled / off / false được giữ nguyên để
// package hiểu là "tắt Redis" (cache luôn miss) — không tự đổi thành
// default, nếu không sẽ mất cách tắt Redis bằng env.
const rawRedisUrl = process.env.PNCH_REDIS_URL;
export const redisUrl = rawRedisUrl === undefined ? "redis://localhost:6379" : rawRedisUrl.trim();

export const cacheApp = process.env.PNCH_CACHE_APP?.trim() || "awing";

// Key prefix Redis: pnch:awing:<BUILD_ID>: — deploy mới không đọc nhầm
// cache của deploy cũ (§3.2 thiết kế). Truyền qua keyPrefix override
// để không phụ thuộc env PNCH_CACHE_KEY_PREFIX.
export const keyPrefix = `pnch:${cacheApp}:${buildId}:`;

// Thư mục disk fallback (L3): ghi qua mỗi lần set + build-time content
// (prerender lúc `next build`). Nằm trong .next/cache để Dockerfile copy
// được vào image; mỗi build một thư mục con theo BUILD_ID, build cũ
// không đọc nhầm disk của build mới. Đổi bằng env CACHE_DISK_DIR
// (vd. emptyDir/volume trên K8s).
export const diskDir = join(
  process.env.CACHE_DISK_DIR?.trim() || join(dotNextDir, "cache", "awing-multi-tier"),
  buildId,
);
