// Cache handler số nhiều (plural): "use cache" / "use cache: remote".
//
// Đường đọc: L1 memory (LRU 50 MB trong wrapper — Next không giữ
// in-memory cache phía trước khi đã đăng ký handler riêng, xem
// cacheMaxMemorySize.md) → L2 Redis (qua @publira) → L3 disk local.
// Redis chết/timeout → thử disk, phục vụ bản cũ thay vì gọi Strapi.
// Circuit breaker (xem multi-tier.mjs): Redis call chậm hơn 300ms thì
// mở breaker 30s — vì @publira thử reconnect 10 lần mỗi lần gọi mới,
// không có breaker thì mỗi request trả giá ~5–11s khi Redis chết.
import { createUseCacheHandler } from "@publira/next-cache-handlers";
import { keyPrefix, redisUrl } from "./config.mjs";
import {
  bufferToStream,
  checkUcEntry,
  deserializeCachePayload,
  hydrateUcTagMirror,
  lowestWallClockOffsetSince,
  memoryDelete,
  memoryGet,
  memorySet,
  noteUcTagRevalidated,
  raceRedis,
  readDiskEntryRaw,
  recordPendingTags,
  redisUsable,
  serializeCachePayload,
  streamToBuffer,
  takePendingTags,
  wallClockOffset,
  writeDiskEntryRaw,
} from "./multi-tier.mjs";

// Next.js load module này lúc khởi động mà không await — throw lúc load
// chỉ được log, server vẫn chạy với handler hỏng. Config sai (vd.
// redis:// mang password) thì dừng server ngay như cách package làm.
let inner;
try {
  inner = createUseCacheHandler({ redisUrl, keyPrefix });
} catch (error) {
  console.error("[awing-cache-handlers]", error);
  process.exit(1);
}

// Ghi lại Redis khi disk trúng mà Redis miss (Redis vừa restart).
// Best-effort, không chặn request. Bỏ qua khi breaker mở.
async function readRepairRedis(cacheKey, stored) {
  if (!redisUsable()) return;
  try {
    const bytes = Buffer.from(stored.valueBase64, "base64");
    await raceRedis(
      inner.set(
        cacheKey,
        Promise.resolve({
          expire: stored.expire,
          revalidate: stored.revalidate,
          stale: stored.stale,
          tags: stored.tags,
          // Entry trên disk lưu timestamp wall clock — đổi sang performance
          // clock trước khi đưa cho handler Redis.
          timestamp: stored.timestamp - wallClockOffset(),
          value: bufferToStream(bytes),
        }),
      ),
      undefined,
    );
  } catch {
    // Best-effort.
  }
}

// Replay các tag đã invalidate trong lúc Redis chết (xem multi-tier.mjs).
async function flushPendingTags() {
  if (!redisUsable()) return;
  const pending = takePendingTags("uc");
  for (const p of pending) {
    try {
      await handler.updateTags(p.tags, p.durations ?? undefined);
    } catch {
      recordPendingTags("uc", p.tags, p.durations ?? undefined);
    }
  }
}

const handler = {
  async get(cacheKey, softTags) {
    // L1 memory.
    const memRaw = memoryGet(cacheKey);
    if (memRaw) {
      let stored = null;
      try {
        stored = deserializeCachePayload(memRaw);
      } catch {
        stored = null;
      }
      const checked = stored ? checkUcEntry(stored, softTags) : null;
      if (checked) return checked;
      memoryDelete(cacheKey);
    }
    // L2 Redis (giới hạn 300ms bởi circuit breaker).
    await flushPendingTags();
    let hit;
    if (redisUsable()) {
      try {
        hit = (await raceRedis(inner.get(cacheKey, softTags), undefined)).value;
      } catch {
        hit = undefined;
      }
    }
    if (hit !== undefined) return hit;
    // L3 disk.
    const diskRaw = readDiskEntryRaw("uc", cacheKey);
    if (!diskRaw) return undefined;
    let stored;
    try {
      stored = deserializeCachePayload(diskRaw);
    } catch {
      return undefined;
    }
    const checked = checkUcEntry(stored, softTags);
    if (!checked) return undefined;
    // Read-repair: disk trúng mà Redis miss → ghi lại Redis + memory.
    memorySet(cacheKey, diskRaw);
    void readRepairRedis(cacheKey, stored);
    return checked;
  },

  async set(cacheKey, pendingEntry) {
    let entry;
    try {
      entry = await pendingEntry;
    } catch {
      return; // Render lỗi thì không có gì để cache.
    }
    if (!process.env.__NEXT_DEV_SERVER && entry.expire === 0) return;
    // Tee stream: một nhánh cho Redis (qua inner), một nhánh để buffer
    // ghi memory + disk. Inner cũng tự tee nên tee hai lần vẫn đúng.
    const [forInner, forStore] = entry.value.tee();
    const storePromise = (async () => {
      try {
        const bytes = await streamToBuffer(forStore);
        const stored = {
          expire: entry.expire,
          revalidate: entry.revalidate,
          stale: entry.stale,
          tags: entry.tags,
          timestamp: entry.timestamp + lowestWallClockOffsetSince(entry.timestamp),
          valueBase64: Buffer.from(bytes).toString("base64"),
        };
        const raw = serializeCachePayload(stored);
        memorySet(cacheKey, raw);
        writeDiskEntryRaw("uc", cacheKey, raw);
      } catch {
        // Ghi memory/disk là best-effort.
      }
    })();
    try {
      if (redisUsable()) {
        await raceRedis(
          inner.set(cacheKey, Promise.resolve({ ...entry, value: forInner })),
          undefined,
        );
      }
    } catch {
      // Ghi Redis lỗi không fail request.
    }
    await storePromise;
  },

  async refreshTags() {
    if (redisUsable()) {
      try {
        await raceRedis(inner.refreshTags(), undefined);
      } catch {
        // Redis chết: mirror local vẫn giữ giá trị cũ.
      }
    }
    await hydrateUcTagMirror();
  },

  async getExpiration(tags) {
    if (!redisUsable()) return 0;
    try {
      return (await raceRedis(inner.getExpiration(tags), 0)).value;
    } catch {
      return 0;
    }
  },

  async updateTags(tags, durations) {
    if (!tags || tags.length === 0) return;
    noteUcTagRevalidated(tags, durations);
    if (redisUsable()) {
      try {
        const { ok } = await raceRedis(inner.updateTags(tags, durations), undefined);
        // Redis không nhận được lệnh xóa → ghi tag chờ để replay sau
        // khi Redis hồi, không mất lần publish này.
        if (!ok) recordPendingTags("uc", tags, durations);
      } catch {
        recordPendingTags("uc", tags, durations);
      }
    } else {
      recordPendingTags("uc", tags, durations);
    }
  },
};

export default handler;
