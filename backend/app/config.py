"""Cấu hình backend từ biến môi trường (xem backend/.env.example)."""

import os

DATABASE_PATH = os.environ.get("DATABASE_PATH", "./awing.db")
PORT = int(os.environ.get("PORT", "8000"))

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
    if origin.strip()
]

PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

JWT_SECRET = os.environ.get("JWT_SECRET", "doi-secret-nay-khi-chay-that")
JWT_EXPIRE_HOURS = 24

STRAPI_WEBHOOK_SECRET = os.environ.get("STRAPI_WEBHOOK_SECRET", "")

# Vòng lặp realtime: chu kỳ đọc SQLite và đẩy full snapshot (giây).
# Trễ thông thường ≈ chu kỳ + vài giây xử lý, trong giới hạn 1 phút đã chốt.
REALTIME_INTERVAL_SECONDS = 30
