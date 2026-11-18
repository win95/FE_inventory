"""Số liệu mạng lưới + phủ sóng + kênh SSE (F03, F04, F06).

Trả rỗng/null khi SQLite chưa có bản ghi — không tự sinh số liệu thay thế.
"""

import asyncio
import json
import sqlite3

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from .. import db
from ..realtime import broadcaster
from ..schemas import (
    CoverageResponse,
    IndustryStat,
    LocationDirectoryEntry,
    NetworkStats,
    ProvinceCoverage,
    VenueTypeCount,
)

router = APIRouter()


@router.get("/api/network-stats", response_model=NetworkStats)
def get_network_stats(conn: sqlite3.Connection = Depends(db.get_conn)):
    row = conn.execute(
        "SELECT connections, provinces, chains, venues FROM network_stats WHERE id = 1"
    ).fetchone()
    if row is None:
        return NetworkStats()
    return NetworkStats(
        connections=row["connections"],
        provinces=row["provinces"],
        chains=row["chains"],
        venues=row["venues"],
    )


@router.get("/api/coverage", response_model=CoverageResponse)
def get_coverage(conn: sqlite3.Connection = Depends(db.get_conn)):
    provinces = [
        ProvinceCoverage(province=r["province"], level=r["level"], venues=r["venues"])
        for r in conn.execute("SELECT province, level, venues FROM provinces ORDER BY province").fetchall()
    ]
    venue_types = [
        VenueTypeCount(type=r["type"], count=r["count"])
        for r in conn.execute("SELECT type, count FROM venue_types ORDER BY type").fetchall()
    ]
    # Thư mục địa điểm và số liệu ngành lấy từ cùng SQLite; chưa có bảng
    # nào thì hai trường này vắng — Frontend tự ẩn khối tương ứng.
    directory = None
    industry_stats = None
    try:
        directory_rows = conn.execute(
            "SELECT name, category, venues FROM directory ORDER BY name"
        ).fetchall()
        directory = [
            LocationDirectoryEntry(name=r["name"], category=r["category"], venues=r["venues"])
            for r in directory_rows
        ]
    except sqlite3.OperationalError:
        pass
    try:
        industry_rows = conn.execute(
            "SELECT industry, engagement, reach FROM industry_stats ORDER BY industry"
        ).fetchall()
        industry_stats = [
            IndustryStat(industry=r["industry"], engagement=r["engagement"], reach=r["reach"])
            for r in industry_rows
        ]
    except sqlite3.OperationalError:
        pass
    return CoverageResponse(
        provinces=provinces,
        venueTypes=venue_types,
        directory=directory,
        industryStats=industry_stats,
    )


@router.get("/api/events/stats")
async def events_stats(request: Request):
    """SSE: full snapshot số liệu mỗi chu kỳ 30 giây + ngay khi kết nối."""
    queue = broadcaster.subscribe()
    broadcaster.broadcast_stats()

    async def generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    # Nhịp giữ kết nối (comment SSE) khi không có gì mới.
                    yield ": heartbeat\n\n"
                    continue
                yield payload
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(generator(), media_type="text/event-stream")
