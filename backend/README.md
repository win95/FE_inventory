# AWING Backend — FastAPI + SQLite

Backend nghiệp vụ của dự án AWING (Plan §6), chạy trên host, ngoài Docker
Compose. Repo này là repo duy nhất của dự án (`win95/FE_inventory`): Frontend
ở `src/`, backend ở `backend/`, Strapi + Compose sẽ bổ sung sau theo Plan.

## Ranh giới (Plan §6 — ranh giới cứng)

- Backend này chỉ lo dữ liệu nghiệp vụ: số liệu mạng lưới, tỉnh/thành + mức
  phủ sóng, địa điểm/venue, định dạng quảng cáo, prompt + kết quả gợi ý, lead,
  tin nhắn liên hệ, người dùng cuối.
- Case study và nội dung home **không** nằm trong SQLite — đã chuyển sang
  Strapi (Postgres). Frontend lấy chúng qua Strapi REST.
- Không mock, không seed dữ liệu mẫu vào code. Database rỗng thì API trả
  rỗng, giao diện hiện trạng thái rỗng.

## Chạy

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # sửa DATABASE_PATH, PORT, secret khi cần
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- OpenAPI tự sinh: http://localhost:8000/docs
- Health check: http://localhost:8000/ → `{"status": "ok"}`
- SQLite: một file duy nhất (`DATABASE_PATH`, mặc định `./awing.db`), tự tạo
  bảng rỗng khi khởi động. Thao tác trực tiếp file này trên host để kiểm tra
  dữ liệu thử nghiệm.

## Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/network-stats` | Số liệu mạng lưới (F03). |
| `GET` | `/api/coverage` | Phủ sóng theo tỉnh, loại venue, thư mục địa điểm, số liệu ngành (F04, F17). |
| `POST` | `/api/suggest` | Gợi ý chiến dịch theo prompt, body `{ prompt, page?, pageSize? }` (F02, F06). |
| `POST` | `/api/leads` | Lead form (F12). |
| `POST` | `/api/contact` | Form Contact Us (F15). |
| `GET` | `/api/events/stats` | SSE: full snapshot số liệu mỗi 30 giây (realtime, trễ tối đa 1 phút). |
| `GET` | `/api/auth/google` | Bắt đầu đăng nhập Google (F13). |
| `GET` | `/api/auth/google/callback` | Callback Google, phát JWT 24h, chuyển về Frontend. |
| `POST` | `/api/webhooks/strapi` | Nhận webhook publish từ Strapi, đẩy sự kiện `content-updated` qua SSE. |

Định dạng lỗi thống nhất: `{"error": {"code": "...", "message": "..."}}`.

Case study lấy qua Strapi REST, không qua backend này.

## Nhập dữ liệu thử nghiệm

Không có dữ liệu mẫu trong code. Điền dữ liệu vào các file CSV trong
`scripts/data/` (hiện chỉ có dòng header), rồi chạy:

```bash
python scripts/import_csv.py
```

Chạy lại nhiều lần đều an toàn (ghi đè theo khóa chính). Hoặc thao tác trực
tiếp bằng `sqlite3 awing.db`.

## Realtime

Vòng lặp nền trong tiến trình FastAPI: mỗi 30 giây đọc SQLite, dựng full
snapshot số liệu rồi đẩy qua SSE cho mọi client đang kết nối. Đẩy mỗi kỳ kể
cả khi dữ liệu chưa đổi; kỳ lỗi thì kỳ sau tự bù toàn bộ.
