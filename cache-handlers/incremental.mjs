// Cache handler số ít (singular): ISR, Route Handler, fetch /
// unstable_cache, next/image (optimizer tích hợp, khi
// images.customCacheHandler = true).
//
// L1 là in-memory server cache của Next (cacheMaxMemorySize mặc định
// 50 MB) nằm phía trước handler này — KHÔNG đặt cacheMaxMemorySize: 0
// (xem next.config.ts). Wrapper thêm L3 disk sau L2 Redis:
// Redis miss/lỗi/timeout → đọc disk, phục vụ bản cũ thay vì gọi Strapi.
// Circuit breaker (xem multi-tier.mjs): Redis call chậm hơn 300ms thì
// mở breaker 30s — vì @publira thử reconnect 10 lần mỗi lần gọi mới,
// không có breaker thì mỗi request trả giá ~5–11s khi Redis chết.
import { RedisIncrementalCacheHandler } from "@publira/next-cache-handlers";
import { keyPrefix, redisUrl } from "./config.mjs";
import {
  addToTagIndex,
  checkIncDiskEntry,
  deleteDiskEntriesForTags,
  deleteDiskEntry,
  deserializeCachePayload,
  extractTags,
  noteIncTagRevalidated,
  raceRedis,
  readDiskEntryRaw,
  readRouteSeed,
  recordPendingTags,
  redisUsable,
  serializeCachePayload,
  takePendingTags,
  writeDiskEntryRaw,
} from "./multi-tier.mjs";

// Replay các tag đã invalidate trong lúc Redis chết (xem multi-tier.mjs).
// Chạy trước khi đọc Redis — không thì entry cũ trên Redis được phục vụ
// như mới sau khi Redis hồi. Best-effort, giới hạn 300ms/tag.
async function flushPendingTags(handler) {
  if (!redisUsable()) return;
  const pending = takePendingTags("inc");
  for (const p of pending) {
    // revalidateTag của wrapper đã tự ghi lại tag chờ khi Redis không
    // nhận được lệnh (race timeout/lỗi) — ở đây chỉ cần gọi nó.
    try {
      await handler.revalidateTag(p.tags, p.durations ?? undefined);
    } catch {
      recordPendingTags("inc", p.tags, p.durations ?? undefined);
    }
  }
}

export default class MultiTierIncrementalCacheHandler extends RedisIncrementalCacheHandler {
  constructor(ctx) {
    super(ctx, { redisUrl, keyPrefix });
  }

  async get(cacheKey, ctx) {
    await flushPendingTags(this);
    // L2 Redis (qua @publira, giới hạn 300ms bởi circuit breaker).
    // Redis chết/timeout → miss, không throw, không trả giá reconnect.
    let hit = null;
    if (redisUsable()) {
      try {
        hit = (await raceRedis(super.get(cacheKey, ctx), null)).value;
      } catch {
        hit = null;
      }
    }
    if (hit) return hit;
    // L3 disk: phục vụ bản cũ khi Redis miss/lỗi. Entry đã bị revalidate
    // (tag xóa sau lúc ghi) thì coi như miss để render lại đồng bộ.
    const raw = readDiskEntryRaw("inc", cacheKey);
    if (raw) {
      let stored;
      try {
        stored = deserializeCachePayload(raw);
      } catch {
        stored = null;
      }
      if (stored) {
        const checked = await checkIncDiskEntry(stored, ctx, this.revalidatedTags);
        if (checked) return checked;
      }
    }
    // L4 seed build-time: trang prerender KHÔNG đi qua set() ở build nên
    // Redis + disk không bao giờ có entry trang; chỉ có seed file ở
    // .next/server/route-cache/ (hoặc legacy .next/server/app/). Đọc seed
    // như FileSystemCache (xem readRouteSeed) — nếu không, trang tĩnh miss
    // → render lại → bailout 500 vì `await params` ở layout [locale].
    return readRouteSeed(cacheKey, ctx, this.revalidatedTags);
  }

  async set(cacheKey, data, ctx = {}) {
    // Ghi Redis trước (bỏ qua khi breaker mở); super.set không throw
    // khi Redis chết (no-op) nhưng race giới hạn 300ms.
    if (redisUsable()) {
      try {
        await raceRedis(super.set(cacheKey, data, ctx), undefined);
      } catch {
        // Ghi Redis lỗi vẫn ghi disk — cache không được fail request.
      }
    }
    if (data === null) {
      deleteDiskEntry("inc", cacheKey);
      return;
    }
    try {
      const tags = extractTags(data, ctx);
      const stored = { lastModified: Date.now(), tags, value: data };
      writeDiskEntryRaw("inc", cacheKey, serializeCachePayload(stored));
      for (const tag of tags) addToTagIndex(tag, cacheKey);
    } catch {
      // Ghi disk là best-effort.
    }
  }

  async revalidateTag(tags, durations) {
    const list = (Array.isArray(tags) ? tags : [tags]).filter(Boolean);
    if (redisUsable()) {
      try {
        const { ok } = await raceRedis(super.revalidateTag(tags, durations), undefined);
        // Redis không nhận được lệnh xóa (timeout/lỗi) → ghi tag chờ để
        // replay sau khi Redis hồi, không mất lần publish này.
        if (!ok && list.length > 0) recordPendingTags("inc", list, durations);
      } catch {
        if (list.length > 0) recordPendingTags("inc", list, durations);
      }
    } else if (list.length > 0) {
      recordPendingTags("inc", list, durations);
    }
    if (list.length > 0) {
      noteIncTagRevalidated(list);
      deleteDiskEntriesForTags("inc", list);
    }
  }

  resetRequestCache() {
    super.resetRequestCache();
  }
}
