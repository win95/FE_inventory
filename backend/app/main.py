"""AWING backend — FastAPI + SQLite (Plan §6).

Chạy trên host, ngoài Docker Compose, bằng Uvicorn:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Định dạng lỗi thống nhất cho mọi endpoint (Plan §6):
    {"error": {"code": "...", "message": "..."}}
OpenAPI tự sinh tại /docs (schema Pydantic là nguồn sự thật cho kiểu dữ liệu).
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config, db
from .realtime import broadcaster
from .routers import auth, leads, stats, suggest, webhooks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("awing.backend")

app = FastAPI(title="AWING Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "Lỗi hệ thống, thử lại sau."}},
    )


@app.on_event("startup")
def startup() -> None:
    db.init_db()
    broadcaster.start()
    logger.info("AWING backend ready — SQLite: %s", config.DATABASE_PATH)


@app.on_event("shutdown")
async def shutdown() -> None:
    await broadcaster.stop()


@app.get("/")
def health():
    return {"status": "ok", "service": "awing-backend"}


app.include_router(stats.router)
app.include_router(suggest.router)
app.include_router(leads.router)
app.include_router(auth.router)
app.include_router(webhooks.router)
