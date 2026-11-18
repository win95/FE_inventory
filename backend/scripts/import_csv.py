"""Nhập dữ liệu nghiệp vụ vào SQLite từ file CSV (không có dữ liệu mẫu).

Cách dùng:
    python scripts/import_csv.py [--db awing.db] [ten-bang ...]

Đọc các file trong scripts/data/<ten-bang>.csv (chỉ có dòng header mẫu, chưa
có dữ liệu — tự điền dữ liệu thử nghiệm vào rồi chạy). Mỗi lần chạy chèn
thêm hoặc ghi đè theo khóa chính của bảng. Chạy lại nhiều lần đều an toàn.
"""

import csv
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db  # noqa: E402

TABLES = {
    "network_stats": ("id,connections,provinces,chains,venues,engagement,off_peak", "id"),
    "provinces": ("province,level,venues", "province"),
    "venue_types": ("type,count", "type"),
    "locations": ("name,area,city,reach", "name,city"),
    "ad_formats": ("name,metric_label,metric_value,duration_seconds", "name"),
    "city_stats": ("city,reach,engagements,impressions_per_day", "city"),
    "directory": ("name,category,venues", "name"),
    "industry_stats": ("industry,engagement,reach", "industry"),
}


def import_table(conn: sqlite3.Connection, data_dir: Path, table: str) -> int:
    columns, _ = TABLES[table]
    path = data_dir / f"{table}.csv"
    if not path.exists():
        print(f"  - {table}: không có file {path.name}, bỏ qua")
        return 0
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = [row for row in reader if any((v or "").strip() for v in row.values())]
    if not rows:
        print(f"  - {table}: file rỗng (chỉ có header), bỏ qua")
        return 0
    cols = [c.strip() for c in columns.split(",")]
    placeholders = ", ".join("?" for _ in cols)
    sql = f"INSERT OR REPLACE INTO {table} ({columns}) VALUES ({placeholders})"
    conn.executemany(sql, [[row.get(c, "") or None for c in cols] for row in rows])
    conn.commit()
    print(f"  - {table}: đã nhập {len(rows)} dòng")
    return len(rows)


def main() -> None:
    db.init_db()
    args = [a for a in sys.argv[1:] if not a.startswith("--db")]
    db_path = None
    for a in sys.argv[1:]:
        if a.startswith("--db="):
            db_path = a.split("=", 1)[1]
    if db_path:
        import app.config as cfg

        cfg.DATABASE_PATH = db_path
    tables = args or list(TABLES)
    unknown = [t for t in tables if t not in TABLES]
    if unknown:
        print(f"Bảng không rõ: {', '.join(unknown)} (có: {', '.join(TABLES)})")
        raise SystemExit(1)
    conn = db.connect()
    try:
        total = 0
        for table in tables:
            total += import_table(conn, Path(__file__).parent / "data", table)
        print(f"Xong: {total} dòng đã nhập vào {db_path or 'awing.db'}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
