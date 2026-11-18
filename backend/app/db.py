"""SQLite — kho dữ liệu nghiệp vụ duy nhất của backend (Plan §6).

Chỉ chứa dữ liệu nghiệp vụ: số liệu mạng lưới, tỉnh/thành + mức phủ sóng,
địa điểm/venue, định dạng quảng cáo, prompt + kết quả gợi ý, lead, tin nhắn
liên hệ, người dùng cuối. Case study và nội dung home KHÔNG nằm ở đây —
đã chuyển sang Strapi (Postgres).

Không có dữ liệu mẫu trong code: bảng được tạo rỗng khi khởi động; muốn có
dữ liệu để xem/kiểm thử thì nhập vào SQLite (xem scripts/import_csv.py).
Kho nào rỗng thì API tương ứng trả rỗng, giao diện hiện trạng thái rỗng.
"""

import sqlite3
from pathlib import Path

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS network_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    connections INTEGER,
    provinces INTEGER,
    chains INTEGER,
    venues INTEGER,
    engagement REAL,
    off_peak REAL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provinces (
    province TEXT PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high')),
    venues INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS venue_types (
    type TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL,
    reach INTEGER,
    UNIQUE (name, city)
);

CREATE TABLE IF NOT EXISTS ad_formats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    metric_label TEXT NOT NULL DEFAULT 'View rate',
    metric_value REAL,
    duration_seconds INTEGER
);

CREATE TABLE IF NOT EXISTS city_stats (
    city TEXT PRIMARY KEY,
    reach INTEGER,
    engagements INTEGER,
    impressions_per_day INTEGER
);

CREATE TABLE IF NOT EXISTS directory (
    name TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    venues INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS industry_stats (
    industry TEXT PRIMARY KEY,
    engagement REAL,
    reach INTEGER
);

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_sub TEXT UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompt_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL DEFAULT 'strapi',
    event TEXT NOT NULL,
    content_type TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    payload TEXT
);
"""


def connect() -> sqlite3.Connection:
    path = Path(config.DATABASE_PATH)
    if path.parent != Path("."):
        path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = connect()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def get_conn():
    """FastAPI dependency: một connection SQLite cho mỗi request."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
