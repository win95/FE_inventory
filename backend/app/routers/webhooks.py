"""Nhận webhook publish từ Strapi (Plan §7.3).

Strapi bắn sự kiện khi editor publish/unpublish/update nội dung. Backend
ghi nhận sự kiện rồi đẩy ngay một sự kiện `content-updated` qua SSE để
Frontend fetch lại nội dung từ Strapi. Webhook chỉ mang tín hiệu — Strapi
vẫn là nguồn sự thật cho nội dung, backend không lưu copy nội dung.
"""

import hmac
import json
import sqlite3

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from .. import config, db
from ..realtime import broadcaster
from ..schemas import StrapiWebhookPayload

router = APIRouter()


@router.post("/api/webhooks/strapi")
async def strapi_webhook(request: Request, conn: sqlite3.Connection = Depends(db.get_conn)):
    raw = await request.body()
    if config.STRAPI_WEBHOOK_SECRET:
        signature = request.headers.get("x-strapi-signature", "")
        expected = hmac.new(
            config.STRAPI_WEBHOOK_SECRET.encode(), raw, "sha256"
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return JSONResponse(
                status_code=401,
                content={"error": {"code": "WEBHOOK_UNAUTHORIZED", "message": "Chữ ký webhook không hợp lệ."}},
            )
    try:
        payload = StrapiWebhookPayload(**json.loads(raw or b"{}"))
    except Exception:  # noqa: BLE001 - payload sai định dạng thì báo rõ
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "WEBHOOK_BAD_PAYLOAD", "message": "Payload webhook không đúng định dạng."}},
        )
    conn.execute(
        "INSERT INTO webhook_events (event, content_type, payload) VALUES (?, ?, ?)",
        (payload.event, payload.model, raw.decode("utf-8", "replace")),
    )
    conn.commit()
    broadcaster.broadcast_content_updated(payload.event, payload.model)
    return {"ok": True}
