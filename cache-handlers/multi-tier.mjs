// Wrapper đa tầng cho cache handler Next.js 16 (P0 K8s FE + cache).
//
// Đường đọc: L1 memory (chỉ interface số nhiều — interface số ít đã có
// in-memory cache của Next phía trước, xem cacheMaxMemorySize) → L2 Redis
// (qua @publira) → L3 disk local (.next/cache/awing-multi-tier) → miss.
// Không bao giờ đọc thẳng Strapi chỉ vì Redis chết (§6.2 thiết kế):
// Redis lỗi/timeout/miss thì thử disk, disk trúng thì phục vụ bản cũ.
//
// Đường ghi: set ghi Redis (qua @publira) + disk + memory (best-effort —
// ghi disk/memory lỗi không fail request). revalidateTag xóa cả Redis
// (qua @publira) + disk + ghi mirror tag.
//
// Hành vi theo tag:
// - Incremental (số ít): revalidateTag XÓA entry mang tag (cả Redis lẫn
//   disk, qua tag index trên disk). Disk get còn kiểm tra mirror tag
//   (hydrate từ Redis khi còn sống) để không phục vụ entry đã bị xóa
//   trên pod khác.
// - Use-cache (số nhiều): invalidation theo timestamp (staleAt/expiredAt)
//   như @publira — disk/memory get áp cùng phép kiểm tra tuổi + tag như
//   handler Redis, nên hành vi 3 tầng giống hệt nhau.
//
// Next.js tạo mới handler số ít mỗi request nên mọi trạng thái dùng chung
// (mirror tag, memory LRU) đều nằm ở module-scope, không nằm trong instance.
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  bufferToStream,
  deserializeCachePayload,
  resolveCacheHandlerConfig,
  serializeCachePayload,
  streamToBuffer,
  withRedis,
} from "@publira/next-cache-handlers";
import { buildId, diskDir, keyPrefix, redisUrl, serverDir, nowMs } from "./config.mjs";

// Cấu hình Redis dùng chung cho cả 2 handler (keyPrefix đã gồm BUILD_ID).
export const cacheConfig = resolveCacheHandlerConfig({ redisUrl, keyPrefix });

// ---------------------------------------------------------------------------
// Circuit breaker cho Redis (L2)
//
// Vấn đề đo được (drill Redis chết, 2026-11-26): @publira getRedisClient()
// khi Redis chết sẽ thử reconnect 10 lần (backoff 100ms..2s ≈ 5.5s+)
// MỖI lần gọi mới, vì promise client lỗi bị xóa khỏi map — nên mỗi cache
// op đều trả giá ~5–11s: /vi 11.0s, news-001 44.7s, trong khi Strapi
// không bị gọi (0 hit) và trang vẫn 200 từ disk/seed. Breaker:
// - Redis call nào chậm hơn REDIS_SLOW_MS (300ms) hoặc throw → coi Redis
//   chết, mở breaker REDIS_COOLDOWN_MS (30s).
// - Trong thời gian breaker mở: bỏ qua Redis hẳn, đi thẳng disk (mỗi
//   request chỉ trả tối đa +300ms cho 1 lần probe đầu tiên sau khi mở).
// - Hết 30s: probe lại 1 lần (vẫn giới hạn 300ms bằng race).
// ---------------------------------------------------------------------------

const REDIS_SLOW_MS = 300;
const REDIS_COOLDOWN_MS = 30_000;
const TIMEOUT = Symbol("redis-timeout");
let redisDeadUntil = 0;

export function redisUsable() {
  // Redis tắt bằng env (PNCH_REDIS_URL rỗng/off/disabled/false — vd. lúc
  // `docker build`, xem Dockerfile): bỏ qua hẳn tầng L2, không gọi
  // @publira. Nếu không, get() của @publira vẫn chạy (Date.now() bên
  // trong) ngay trong prerender và làm `next build` lỗi với cacheComponents.
  if (!cacheConfig.redisUrl) return false;
  return nowMs() >= redisDeadUntil;
}

export function markRedisDead() {
  redisDeadUntil = nowMs() + REDIS_COOLDOWN_MS;
}

/**
 * Chạy 1 Redis call với giới hạn thời gian. Trả { ok, value }: ok=false
 * khi timeout/lỗi/breaker đang mở (value = fallback). Promise gốc vẫn
 * chạy nền sau timeout (không chặn request). Mọi Redis call của wrapper
 * đều phải đi qua đây — không gọi trực tiếp handler @publira / withRedis
 * khi Redis có thể chết.
 */
export async function raceRedis(promise, fallback) {
  if (!redisUsable()) return { ok: false, value: fallback };
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), REDIS_SLOW_MS);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    if (result === TIMEOUT) {
      markRedisDead();
      return { ok: false, value: fallback };
    }
    return { ok: true, value: result };
  } catch {
    clearTimeout(timer);
    markRedisDead();
    return { ok: false, value: fallback };
  }
}

// ---------------------------------------------------------------------------
// Tag chờ đồng bộ sang Redis (publish trong lúc Redis chết)
//
// revalidateTag/updateTags khi Redis chết (breaker mở hoặc race timeout)
// thì chỉ xóa disk + ghi mirror local — Redis vẫn giữ tag cũ nên sau khi
// Redis hồi, entry cũ trên Redis sẽ được phục vụ như mới (tới hết
// revalidate TTL). Để không mất lần publish đó, ghi tag chờ vào danh sách
// (memory + file disk, sống qua restart pod); lần get() đầu tiên sau khi
// Redis hồi sẽ replay các tag này sang Redis rồi mới đọc Redis.
// Giới hạn còn lại (theo §6.2 thiết kế): pod khác không thấy danh sách
// pending của pod này — entry Redis cũ trên pod khác chỉ hết hạn theo
// revalidate TTL (nội dung 1h, Global 1d).
// ---------------------------------------------------------------------------

const PENDING_TAGS_FILE = join(diskDir, "pending-tags.json");
let pendingTags = null; // [{ kind: "inc" | "uc", tags, durations }]

function loadPendingTags() {
  if (pendingTags !== null) return pendingTags;
  try {
    const parsed = JSON.parse(readFileSync(PENDING_TAGS_FILE, "utf8"));
    pendingTags = Array.isArray(parsed) ? parsed : [];
  } catch {
    pendingTags = [];
  }
  return pendingTags;
}

function savePendingTags() {
  try {
    ensureDir(diskDir);
    writeFileSync(PENDING_TAGS_FILE, JSON.stringify(pendingTags ?? []), "utf8");
  } catch {
    // Best-effort.
  }
}

export function recordPendingTags(kind, tags, durations) {
  const list = loadPendingTags();
  const key = JSON.stringify([...tags].sort());
  // Dedupe: cùng 1 kind + cùng tập tag thì chỉ giữ 1 mục (replay 1 tag
  // nhiều lần cũng như 1 lần) — không thì publish liên tục trong lúc
  // Redis chết sẽ làm file phình và lần replay đầu sau khi Redis hồi
  // chạy tuần tự từng mục (mỗi mục tối đa 300ms).
  const existing = list.find((p) => p.kind === kind && JSON.stringify([...p.tags].sort()) === key);
  if (existing) {
    existing.at = nowMs();
    existing.durations = durations ?? null;
  } else {
    list.push({ kind, tags: [...tags], durations: durations ?? null, at: nowMs() });
  }
  savePendingTags();
}

/** Lấy + xóa các tag chờ của 1 kind (để wrapper replay sang Redis). */
export function takePendingTags(kind) {
  const list = loadPendingTags();
  const taken = list.filter((p) => p.kind === kind);
  if (taken.length === 0) return taken;
  pendingTags = list.filter((p) => p.kind !== kind);
  savePendingTags();
  return taken;
}

// ---------------------------------------------------------------------------
// Disk (L3)
// ---------------------------------------------------------------------------

const ENTRY_DIR = join(diskDir, "entries");
const TAG_DIR = join(diskDir, "tags");

function sha(text) {
  return createHash("sha256").update(text).digest("hex");
}

function entryPath(kind, cacheKey) {
  return join(ENTRY_DIR, `${kind}-${sha(cacheKey)}.json`);
}

function tagPath(tag) {
  return join(TAG_DIR, `${sha(tag)}.json`);
}

function ensureDir(dir) {
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // Ghi disk là best-effort: không tạo được thư mục thì bỏ qua.
  }
}

/** Đọc entry disk đã serialize (chuỗi giống hệt giá trị trong Redis). */
export function readDiskEntryRaw(kind, cacheKey) {
  try {
    return readFileSync(entryPath(kind, cacheKey), "utf8");
  } catch {
    return null;
  }
}

export function writeDiskEntryRaw(kind, cacheKey, raw) {
  try {
    ensureDir(ENTRY_DIR);
    writeFileSync(entryPath(kind, cacheKey), raw, "utf8");
  } catch {
    // Best-effort: ghi disk lỗi không fail request.
  }
}

export function deleteDiskEntry(kind, cacheKey) {
  try {
    rmSync(entryPath(kind, cacheKey), { force: true });
  } catch {
    // Best-effort.
  }
}

// Tag index trên disk (giống tagkeys của @publira trên Redis):
// tags/<sha(tag)>.json = { tag, keys: [cacheKey...] } — để revalidateTag
// biết entry disk nào mang tag mà xóa.
function readTagIndex(tag) {
  try {
    const parsed = JSON.parse(readFileSync(tagPath(tag), "utf8"));
    return Array.isArray(parsed?.keys) ? parsed.keys : [];
  } catch {
    return [];
  }
}

function addToTagIndex(tag, cacheKey) {
  try {
    ensureDir(TAG_DIR);
    const keys = readTagIndex(tag);
    if (!keys.includes(cacheKey)) {
      keys.push(cacheKey);
      writeFileSync(tagPath(tag), JSON.stringify({ tag, keys }), "utf8");
    }
  } catch {
    // Best-effort.
  }
}

export function deleteDiskEntriesForTags(kind, tags) {
  for (const tag of tags) {
    for (const key of readTagIndex(tag)) deleteDiskEntry(kind, key);
    try {
      rmSync(tagPath(tag), { force: true });
    } catch {
      // Best-effort.
    }
  }
}

// Dọn thư mục disk của build cũ (quá 7 ngày) lúc module load — tránh
// disk phình theo số lần deploy. Không bao giờ xóa thư mục build hiện tại.
(function pruneOldDiskDirs() {
  try {
    const base = dirname(diskDir);
    const now = nowMs();
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === buildId) continue;
      const path = join(base, entry.name);
      if (now - statSync(path).mtimeMs > 7 * 24 * 3600 * 1000) {
        rmSync(path, { recursive: true, force: true });
      }
    }
  } catch {
    // Best-effort.
  }
})();

// ---------------------------------------------------------------------------
// Mirror tag (module-scope)
// ---------------------------------------------------------------------------

// Incremental: tag -> thời điểm revalidate (ms, wall clock).
const incTagMirror = new Map();

export function noteIncTagRevalidated(tags, at = nowMs()) {
  for (const tag of tags) incTagMirror.set(tag, at);
}

function isIncTagExpired(tags, lastModified) {
  for (const tag of tags) {
    const at = incTagMirror.get(tag);
    if (at !== undefined && at > lastModified) return true;
  }
  return false;
}

// Đọc timestamp revalidate từ Redis (inc:tag:<tag>) cho các tag chưa biết —
// để pod này biết tag đã bị xóa trên pod khác (publish → revalidateTag).
// Redis chết thì bỏ qua (trả bản cũ trên disk, theo §6.2).
async function hydrateIncTagMirror(tags) {
  if (!redisUsable()) return; // Redis chết: bỏ qua, không trả giá reconnect.
  const missing = tags.filter((tag) => !incTagMirror.has(tag));
  if (missing.length === 0) return;
  const { value: values } = await raceRedis(
    withRedis(cacheConfig, null, async (client) => {
      const keys = missing.map((tag) => `${keyPrefix}inc:tag:${tag}`);
      return client.mGet(keys);
    }),
    null,
  );
  if (!values) return;
  missing.forEach((tag, i) => {
    const raw = values[i];
    if (raw == null) return;
    const ts = Number(raw);
    if (Number.isFinite(ts)) incTagMirror.set(tag, ts);
  });
}

// Use-cache: tag -> { staleAt, expiredAt } (ms, wall clock).
const ucTagMirror = new Map();

function isUcStaleByTags(tags, entryTimestamp) {
  return (tags ?? []).some((tag) => (ucTagMirror.get(tag)?.staleAt ?? 0) > entryTimestamp);
}

function isUcExpiredByTags(tags, entryTimestamp, now) {
  return (tags ?? []).some((tag) => {
    const r = ucTagMirror.get(tag);
    return r !== undefined && r.staleAt > entryTimestamp && r.expiredAt <= now;
  });
}

// Đồng bộ mirror use-cache từ Redis (index uc:revalidated-tags + từng
// uc:tag:<tag>) — gọi sau khi delegate refreshTags cho handler Redis.
export async function hydrateUcTagMirror() {
  if (!redisUsable()) return; // Redis chết: bỏ qua, không trả giá reconnect.
  const { value: tags } = await raceRedis(
    withRedis(cacheConfig, [], async (client) =>
      client.sMembers(`${keyPrefix}uc:revalidated-tags`),
    ),
    [],
  );
  if (!tags || tags.length === 0) return;
  const { value: values } = await raceRedis(
    withRedis(cacheConfig, null, async (client) =>
      client.mGet(tags.map((tag) => `${keyPrefix}uc:tag:${tag}`)),
    ),
    null,
  );
  if (!values) return;
  tags.forEach((tag, i) => {
    const raw = values[i];
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.staleAt === "number" && typeof parsed.expiredAt === "number") {
        ucTagMirror.set(tag, parsed);
      }
    } catch {
      // Bản ghi tag hỏng thì bỏ qua — lần revalidate sau ghi lại.
    }
  });
}

export function noteUcTagRevalidated(tags, durations) {
  const now = nowMs();
  const revalidation = {
    expiredAt: durations?.expire === undefined ? now : now + durations.expire * 1000,
    staleAt: now,
  };
  for (const tag of tags) ucTagMirror.set(tag, revalidation);
}

// ---------------------------------------------------------------------------
// Wall clock offset (giống @publira: timestamp lưu trên Redis/disk là wall
// clock, Next.js so sánh bằng performance clock nên phải đổi qua lại).
// ---------------------------------------------------------------------------

const offsetHistory = [];
const WALL_CLOCK_OFFSET_HISTORY_MS = 36e5;

function wallClockOffset() {
  const at = performance.timeOrigin + performance.now();
  const offset = nowMs() - at;
  const last = offsetHistory.at(-1);
  if (last === undefined || Math.abs(offset - last.offset) >= 1) {
    offsetHistory.push({ at, offset });
  }
  const horizon = at - WALL_CLOCK_OFFSET_HISTORY_MS;
  while ((offsetHistory[1]?.at ?? Infinity) <= horizon) offsetHistory.shift();
  return offset;
}

function lowestWallClockOffsetSince(since) {
  let lowest = wallClockOffset();
  for (let i = 0; i < offsetHistory.length; i++) {
    const next = offsetHistory[i + 1];
    if (next === undefined || next.at > since) lowest = Math.min(lowest, offsetHistory[i].offset);
  }
  return lowest;
}

// ---------------------------------------------------------------------------
// Memory LRU (L1 cho interface số nhiều — interface này không có in-memory
// cache của Next phía trước khi đã đăng ký handler riêng, xem
// cacheMaxMemorySize.md; interface số ít đã có server cache 50 MB của Next
// nên không cần thêm tầng memory ở đây).
// ---------------------------------------------------------------------------

const MEMORY_MAX_BYTES = 50 * 1024 * 1024;
const MEMORY_MAX_ENTRIES = 1000;
const memoryEntries = new Map(); // cacheKey -> { raw, bytes } (thứ tự chèn = LRU)
let memoryBytes = 0;

export function memoryGet(cacheKey) {
  const entry = memoryEntries.get(cacheKey);
  if (!entry) return null;
  memoryEntries.delete(cacheKey);
  memoryEntries.set(cacheKey, entry);
  return entry.raw;
}

export function memorySet(cacheKey, raw) {
  const bytes = Buffer.byteLength(raw, "utf8");
  const old = memoryEntries.get(cacheKey);
  if (old) memoryBytes -= old.bytes;
  memoryEntries.set(cacheKey, { raw, bytes });
  memoryBytes += bytes;
  while (
    (memoryBytes > MEMORY_MAX_BYTES || memoryEntries.size > MEMORY_MAX_ENTRIES) &&
    memoryEntries.size > 1
  ) {
    const oldest = memoryEntries.keys().next();
    if (oldest.done) break;
    const victim = memoryEntries.get(oldest.value);
    memoryBytes -= victim?.bytes ?? 0;
    memoryEntries.delete(oldest.value);
  }
}

export function memoryDelete(cacheKey) {
  const entry = memoryEntries.get(cacheKey);
  if (entry) {
    memoryBytes -= entry.bytes;
    memoryEntries.delete(cacheKey);
  }
}

// ---------------------------------------------------------------------------
// Helpers dùng chung
// ---------------------------------------------------------------------------

export function extractTags(data, ctx) {
  const tags = new Set();
  if (ctx?.tags) {
    for (const tag of ctx.tags) if (tag) tags.add(tag);
  }
  if (data && typeof data === "object" && Array.isArray(data.tags)) {
    for (const tag of data.tags) if (tag) tags.add(tag);
  }
  const headers = data && typeof data === "object" ? data.headers : undefined;
  const headerVal = headers?.["x-next-cache-tags"] ?? headers?.["X-Next-Cache-Tags"];
  if (typeof headerVal === "string" && headerVal.length > 0) {
    for (const tag of headerVal.split(",")) {
      const trimmed = tag.trim();
      if (trimmed) tags.add(trimmed);
    }
  }
  return [...tags];
}

/**
 * Kiểm tra entry use-cache (payload đã deserialize) theo đúng chính sách
 * của handler Redis @publira: quá revalidate thì miss, quá expire thì
 * miss, tag stale thì trả về với revalidate=1 (phục vụ bản cũ + làm mới
 * nền), tag hết cửa sổ stale thì miss. Trả entry theo định dạng Next.js
 * cần (timestamp trên performance clock, value là stream mới).
 */
export function checkUcEntry(stored, softTags) {
  if (!stored || typeof stored !== "object") return null;
  if (typeof stored.valueBase64 !== "string") return null;
  const now = nowMs();
  // Giống @publira: dev dùng expire, production dùng revalidate làm ngưỡng.
  const maxAgeSeconds = process.env.__NEXT_DEV_SERVER ? stored.expire : stored.revalidate;
  if (now > stored.timestamp + maxAgeSeconds * 1000) return null;
  if (now > stored.timestamp + stored.expire * 1000) return null;
  if (
    isUcExpiredByTags(stored.tags, stored.timestamp, now) ||
    isUcExpiredByTags(softTags, stored.timestamp, now)
  ) {
    return null;
  }
  const isStale =
    isUcStaleByTags(stored.tags, stored.timestamp) ||
    isUcStaleByTags(softTags, stored.timestamp);
  const bytes = Buffer.from(stored.valueBase64, "base64");
  return {
    expire: stored.expire,
    // Entry stale vì tag → Next.js làm mới nền sau 1 giây, request này
    // vẫn nhận bản cũ (giống @publira: STALE_REVALIDATE_SECONDS = 1).
    revalidate: isStale ? 1 : stored.revalidate,
    stale: stored.stale,
    tags: stored.tags,
    timestamp: stored.timestamp - wallClockOffset(),
    value: bufferToStream(bytes),
  };
}

/** Kiểm tra entry incremental trên disk: tag nào bị revalidate sau khi
 * entry được ghi thì coi như miss (để Next.js render lại đồng bộ). */
export async function checkIncDiskEntry(stored, ctx, revalidatedTags) {
  if (!stored || typeof stored !== "object") return null;
  const tags = [
    ...new Set([...(stored.tags ?? []), ...(ctx?.softTags ?? []), ...(ctx?.tags ?? [])]),
  ];
  if (tags.some((tag) => revalidatedTags?.has(tag))) return null;
  await hydrateIncTagMirror(tags);
  if (isIncTagExpired(tags, stored.lastModified)) return null;
  return {
    lastModified: stored.lastModified,
    tags: stored.tags,
    value: stored.value,
  };
}

// ---------------------------------------------------------------------------
// Seed build-time (L4 — chỉ interface số ít, kind response)
//
// Vấn đề: Next 16 KHÔNG gọi set() của handler cho trang prerender ở build
// (trang chỉ nằm ở .next/server/app/*.html + prerender-manifest). Handler
// mặc định (FileSystemCache) tự đọc seed đó lúc runtime rồi "promote" lên
// route-cache; handler custom thì KHÔNG — get() miss → Next render lại
// tĩnh → gặp `await params` ở layout [locale] thì bailout 500
// (NEXT_STATIC_GEN_BAILOUT). Doc incrementalCacheHandlerPath.md: "When an
// adapter is configured, build-time response artifacts are written directly
// to their scoped server/route-cache keys" — tức seed nằm ở
// .next/server/route-cache/<scoped-key>.html/.rsc/.meta (+ .segments/),
// handler phải tự đọc như FileSystemCache làm. Không promote seed sang
// Redis/disk: seed là artifact bất biến trong image, mọi pod đọc seed
// local của mình; L1 memory của Next đã hấp thụ lần đọc lặp lại.
// Tag revalidate vẫn kiểm tra qua mirror như entry disk (seed cũ sau
// publish → miss → render lại).
// ---------------------------------------------------------------------------

const RESPONSE_KINDS = new Set(["APP_PAGE", "APP_ROUTE", "PAGES"]);

function seedTagsFromMeta(meta) {
  const raw = meta?.headers?.["x-next-cache-tags"];
  if (typeof raw !== "string" || raw.length === 0) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function seedOwnerNamespaceMatches(meta, key) {
  const owner = meta?.routeCache?.owner;
  if (!owner || typeof owner.sourceRoute !== "string") return false;
  const namespaceEnd = key.indexOf("/$/");
  if (namespaceEnd === -1) return false;
  const expected = `/route-cache/${owner.kind}/${sha(owner.sourceRoute)}`;
  return key.slice(0, namespaceEnd) === expected;
}

/**
 * Đọc seed prerender build-time cho một response key (scoped key dạng
 * /route-cache/<KIND>/<hash>/$/<path>). Trả về đúng định dạng
 * { lastModified, value, cacheControl? } như FileSystemCache.get(),
 * hoặc null khi không có seed / seed đã bị revalidate / đọc lỗi.
 * Thử đường scoped trước (.next/server/route-cache/<key>.*), rồi đường
 * legacy (.next/server/app/<path>.*) với kiểm chứng meta.routeCache
 * (key + isFallback + owner namespace) như built-in.
 */
export async function readRouteSeed(cacheKey, ctx, revalidatedTags) {
  if (process.env.NEXT_RUNTIME === "edge") return null;
  const kind = ctx?.kind;
  if (!RESPONSE_KINDS.has(kind)) return null;
  if (typeof cacheKey !== "string" || !cacheKey.startsWith("/route-cache/")) return null;
  try {
    let base = join(serverDir, cacheKey); // scoped: .next/server/route-cache/...
    let meta = null;
    const scopedHtml = join(serverDir, cacheKey + (kind === "APP_ROUTE" ? ".body" : ".html"));
    let useLegacy = false;
    try {
      statSync(scopedHtml);
    } catch {
      useLegacy = true;
    }
    if (useLegacy) {
      const marker = cacheKey.indexOf("/$/");
      if (marker === -1) return null;
      const legacyKey = cacheKey.slice(marker + 2); // vd. "/vi"
      const legacyBase = join(serverDir, "app", legacyKey);
      let legacyMeta;
      try {
        legacyMeta = JSON.parse(readFileSync(legacyBase + ".meta", "utf8"));
      } catch {
        return null;
      }
      const isFallbackOk =
        legacyMeta?.routeCache?.isFallback === Boolean(ctx?.isFallback) ||
        (kind === "APP_PAGE" && ctx?.isRoutePPREnabled && legacyMeta?.postponed != null);
      if (legacyMeta?.routeCache?.key !== cacheKey || !isFallbackOk) return null;
      if (!seedOwnerNamespaceMatches(legacyMeta, cacheKey)) return null;
      base = legacyBase;
      meta = legacyMeta;
    }
    // Đọc file seed (sync — file local, chỉ chạy khi Redis + disk miss).
    const isRoute = kind === "APP_ROUTE";
    const primaryPath = base + (isRoute ? ".body" : ".html");
    const mtime = statSync(primaryPath).mtimeMs;
    if (!meta) meta = JSON.parse(readFileSync(base + ".meta", "utf8"));
    const lastModified = meta.routeCacheLastModified ?? mtime;
    const tags = seedTagsFromMeta(meta);
    if (tags.some((tag) => revalidatedTags?.has(tag))) return null;
    await hydrateIncTagMirror(tags);
    if (isIncTagExpired(tags, lastModified)) return null;
    if (isRoute) {
      return {
        lastModified,
        value: {
          kind: "APP_ROUTE",
          body: readFileSync(primaryPath),
          headers: meta.headers,
          status: meta.status,
        },
        cacheControl: meta.cacheControl,
      };
    }
    if (kind === "PAGES") {
      let pageData = {};
      if (!ctx?.isFallback) {
        try {
          pageData = JSON.parse(readFileSync(base + ".json", "utf8"));
        } catch {
          pageData = {};
        }
      }
      return {
        lastModified,
        value: {
          kind: "PAGES",
          html: readFileSync(primaryPath, "utf8"),
          pageData,
          headers: meta.headers,
          status: meta.status,
        },
      };
    }
    // APP_PAGE.
    let segmentData;
    if (Array.isArray(meta.segmentPaths)) {
      const map = new Map();
      const segmentsDir = base + ".segments";
      for (const segmentPath of meta.segmentPaths) {
        try {
          map.set(segmentPath, readFileSync(join(segmentsDir + segmentPath + ".segment.rsc")));
        } catch {
          // Segment thiếu thì coi như dynamic, không prefetch (như built-in).
        }
      }
      segmentData = map;
    }
    let rscData;
    if (!ctx?.isFallback && (!ctx?.isRoutePPREnabled || meta.postponed == null)) {
      try {
        rscData = readFileSync(base + ".rsc");
      } catch {
        rscData = undefined;
      }
    }
    return {
      lastModified,
      value: {
        kind: "APP_PAGE",
        html: readFileSync(primaryPath, "utf8"),
        rscData,
        postponed: meta.postponed,
        headers: meta.headers,
        status: meta.status,
        segmentData,
      },
      cacheControl: meta.cacheControl,
    };
  } catch {
    return null;
  }
}

// Serialize/deserialize + stream helpers (dùng lại của @publira để 3 tầng
// giữ đúng một định dạng payload).
export { bufferToStream, deserializeCachePayload, serializeCachePayload, streamToBuffer };

// Ghi disk cho use-cache: cần tag index không? Không — invalidation của
// use-cache theo timestamp (mirror), không xóa entry; entry cũ trên disk
// tự hết hạn theo tuổi + mirror check lúc đọc.
export { addToTagIndex };
export { lowestWallClockOffsetSince, wallClockOffset };
