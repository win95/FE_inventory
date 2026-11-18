"""Kênh realtime — vòng lặp backend push full snapshot (Plan §7).

Một tác vụ nền chạy trong tiến trình FastAPI: mỗi chu kỳ REALTIME_INTERVAL
(30 giây) đọc SQLite, dựng full snapshot số liệu mạng lưới rồi đẩy xuống
mọi client SSE đang kết nối. Đẩy mỗi kỳ kể cả khi dữ liệu chưa đổi; kỳ nào
lỗi thì ghi log bỏ qua, kỳ sau tự bù toàn bộ (không cần phát lại).

Sự kiện publish từ Strapi (qua webhook) cũng đẩy ngay một sự kiện tên
`content-updated` để Frontend fetch lại nội dung từ Strapi. Frontend chỉ
lắng nghe message mặc định (snapshot số liệu) nên event có tên không làm
hỏng client hiện tại.
"""

import asyncio
import json
import logging
import sqlite3

from . import config, db

logger = logging.getLogger("awing.realtime")


def read_stats_snapshot() -> dict:
    conn = db.connect()
    try:
        row = conn.execute(
            "SELECT connections, provinces, chains, venues FROM network_stats WHERE id = 1"
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        return {"connections": None, "provinces": None, "chains": None, "venues": None}
    return {
        "connections": row["connections"],
        "provinces": row["provinces"],
        "chains": row["chains"],
        "venues": row["venues"],
    }


class Broadcaster:
    """Giữ danh sách client SSE; một vòng lặp duy nhất đẩy snapshot."""

    def __init__(self) -> None:
        self._queues: set[asyncio.Queue] = set()
        self._task: asyncio.Task | None = None
        self._running = False

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._queues.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        self._queues.discard(queue)

    def _broadcast(self, payload: str) -> None:
        for queue in list(self._queues):
            queue.put_nowait(payload)

    def broadcast_stats(self) -> None:
        snapshot = read_stats_snapshot()
        self._broadcast(f"data: {json.dumps(snapshot)}\n\n")

    def broadcast_content_updated(self, event: str, content_type: str | None) -> None:
        payload = json.dumps(
            {"type": "content-updated", "event": event, "contentType": content_type}
        )
        self._broadcast(f"event: content-updated\ndata: {payload}\n\n")

    async def _loop(self) -> None:
        while self._running:
            try:
                self.broadcast_stats()
            except Exception:  # noqa: BLE001 - kỳ lỗi thì bỏ qua, kỳ sau bù
                logger.exception("Realtime loop: không đẩy được snapshot kỳ này")
            await asyncio.sleep(config.REALTIME_INTERVAL_SECONDS)

    def start(self) -> None:
        if self._task is not None:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None


broadcaster = Broadcaster()
