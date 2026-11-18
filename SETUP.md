# Hướng dẫn setup — AWING Home Public (FE_inventory)

Hướng dẫn chạy toàn bộ hệ thống: Frontend Next.js + backend FastAPI + SQLite +
Strapi CMS + Docker Compose. Đọc hết mục 1 (trạng thái) trước khi chạy.

## 1. Trạng thái hiện tại — cái gì đã có, cái gì chưa

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Frontend Next.js (`~/workspace/new-project`, repo này) | ✅ Xong, đã push | 5 route: `/`, `/advertisers`, `/contact`, `/locations`, `/icon.svg`. `npm run lint` sạch, `npm run build` pass. |
| Backend FastAPI + SQLite | ✅ Đã có code (repo riêng `win95/BE_inventory`) | Chạy trên host theo mục 5. Chưa có dữ liệu thật trong SQLite — cần nhập dữ liệu thử nghiệm (mục 5.5) thì các khối mới hiện số. |
| Strapi CMS + Postgres | ❌ Chưa dựng | Cần scaffold theo mục 4. Chưa có content type, chưa có bài viết nào. |
| Dữ liệu SQLite / Strapi | ❌ Chưa có | Database rỗng → giao diện hiện trạng thái rỗng/lỗi rõ ràng, không tự điền số. Đây là hành vi đúng theo thiết kế, không phải lỗi. |

## 2. Tổng quan kiến trúc (mô hình lai đã chốt)

```text
Người dùng ──► Next.js Frontend (:3000)
                 │  nội dung blog/case study/product/home
                 ├────────────────────────► Strapi CMS (:1337) + Postgres (:5432)
                 │  nghiệp vụ: gợi ý, số liệu, heatmap, Lead/Contact, login Google
                 └────────────────────────► FastAPI + SQLite (:8000, chạy trên host)
Editor ────► Strapi Admin (:1337/admin) ── Publish ──► webhook ──► FastAPI
                                                              │ (đẩy sự kiện qua SSE)
                                                              └────► Frontend fetch lại nội dung
```

Quy tắc đã chốt:

- **Strapi** chỉ lo nội dung + admin: blog, case study, product, nội dung home,
  upload ảnh, SEO cơ bản, Draft/Publish. Editor đăng nhập Strapi admin bằng
  tài khoản riêng.
- **FastAPI + SQLite** lo nghiệp vụ: gợi ý chiến dịch, số liệu mạng lưới,
  heatmap phủ sóng, form Lead/Contact, đăng nhập Google cho người dùng cuối,
  vòng lặp realtime push full snapshot mỗi 30 giây (trễ tối đa 1 phút).
- **Frontend gọi cả hai** (`src/lib/api.ts` tách 2 client). Auth tách bạch,
  không gộp JWT hai bên.
- **FastAPI chạy ngoài Docker Compose** (API + dữ liệu thử nghiệm, cần thao
  tác trực tiếp file SQLite trên host). **Strapi + Postgres chạy trong
  Docker Compose.**

Bảng cổng mặc định:

| Dịch vụ | Cổng | Chạy ở đâu |
|---|---|---|
| Frontend Next.js | 3000 | Host (`npm run dev`) |
| FastAPI + SQLite | 8000 | Host (Uvicorn) |
| Strapi CMS | 1337 | Docker Compose |
| Postgres (cho Strapi) | 5432 | Docker Compose |

## 3. Yêu cầu chung

- **Node.js 22 hoặc 24 LTS** (`node -v` kiểm tra; Strapi 5 chỉ chạy Node LTS,
  bản lẻ như 23/25 không hỗ trợ). npm đi kèm Node.
- **Python 3.11+** cho backend FastAPI.
- **Docker + Docker Compose** cho Strapi + Postgres.
- Git để clone repo.

```bash
git clone https://github.com/win95/FE_inventory.git
cd FE_inventory
```

## 4. Frontend Next.js

```bash
npm install
cp .env.example .env.local
npm run dev      # http://localhost:3000
```

Biến môi trường (xem `.env.example`):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend FastAPI. Để trống = chưa cấu hình → giao diện hiện trạng thái rỗng/lỗi. |
| `NEXT_PUBLIC_STRAPI_URL` | `http://localhost:1337` | Strapi CMS. Để trống = khối nội dung hiện trạng thái rỗng. |

Kiểm tra:

```bash
npm run lint     # phải sạch, không lỗi
npm run build    # phải pass; route hiện ra gồm /, /advertisers, /contact, /locations, /icon.svg
```

Lưu ý: **chưa có backend thì các mục dữ liệu hiện empty/error state là đúng.**
Nút đăng nhập Google đang disabled cho tới khi backend cấu hình xong auth.

## 5. Backend FastAPI + SQLite (chạy trên host, ngoài Compose)

Code backend ở repo riêng `win95/BE_inventory` (FastAPI + SQLite, chạy trên
host, ngoài Compose). Clone riêng rồi khởi tạo và chạy:

### 5.1. Khởi tạo

```bash
git clone https://github.com/win95/BE_inventory.git
cd BE_inventory
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # sửa DATABASE_PATH, PORT, secret khi cần
```

### 5.2. Chạy

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

SQLite: một file duy nhất, ví dụ `awing.db` đặt cạnh code backend. Backend
tự tạo bảng khi khởi động (hoặc chạy script seed/migration của backend).
Thao tác trực tiếp file này trên host để thêm/xoá/sửa dữ liệu thử nghiệm.

### 5.3. Hợp đồng API Frontend đang gọi

Base URL: `NEXT_PUBLIC_API_BASE_URL`. Tất cả trả JSON. CORS phải mở cho
`http://localhost:3000` (khi chạy local).

| Method | Endpoint | Dùng ở đâu | Ghi chú |
|---|---|---|---|
| `GET` | `/api/network-stats` | Dải số liệu, màn Location Network | `{ connections, provinces, chains, venues }` — null nếu chưa có. |
| `GET` | `/api/coverage` | Heatmap, màn Location Network | `{ provinces: [{ province, level, venues }], venueTypes: [{ type, count }], directory?, industryStats? }`. `directory` = thư mục địa điểm `{ name, category, venues }`; `industryStats` = số liệu theo ngành `{ industry, engagement, reach }`. Hai trường sau không có thì Frontend tự ẩn khối tương ứng. |
| `POST` | `/api/suggest` | Trang `/advertisers` | Body `{ prompt }`. Trả `{ overview: { locations, venues, reach, engagement, offPeak }, locations: [{ name, area, city, reach }], formats: [{ name, metricLabel, metricValue, durationSeconds? }], cities?: [{ name, reach, engagements, impressionsPerDay }] }`. `cities` để chip thành phố bật/tắt tính lại tổng. |
| `POST` | `/api/leads` | Lead form (trang chủ) | Body `{ name, email, phone, message }`. Ghi vào SQLite, trả 200/201 khi nhận. |

Case study **không** qua backend này: Frontend lấy qua Strapi REST
(`GET /api/case-studies` trên Strapi, chỉ bản published), theo ranh giới
đã chốt ở Plan §6.
| `POST` | `/api/contact` | Form Contact Us (`/contact`) | Body `{ type, name, email, phone, message }`. Ghi vào SQLite. |
| `GET` | `/api/events/stats` | Realtime (SSE) | Server-Sent Events, mỗi sự kiện là một full snapshot `NetworkStats`. Xem mục 5.4. |
| `GET` | `/api/auth/google` | Nút đăng nhập Google | Bắt đầu luồng OAuth Google, callback về Frontend. Cần `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (tạo trên Google Cloud Console) và redirect URI khớp với cấu hình. |
| `POST` | `/api/webhooks/strapi` | Nhận webhook từ Strapi | Xem mục 6.4. |

### 5.4. Realtime — vòng lặp backend push full data (đã chốt)

- Một tác vụ nền chạy trong chính tiến trình FastAPI, mỗi kỳ **30 giây**:
  đọc SQLite, dựng **full snapshot** của số liệu (F03), phủ sóng (F04) và
  reach/engagement (F06), đẩy qua SSE xuống mọi Frontend đang kết nối.
- Frontend thay toàn bộ khối hiển thị, không cộng dồn hay vá từng trường.
- Ngân sách trễ: chu kỳ 30 giây + vài giây xử lý ≈ 35–40 giây, trong giới
  hạn 1 phút đã chốt. Kỳ nào lỗi thì ghi log bỏ qua, kỳ sau tự bù toàn bộ
  (không cần cơ chế phát lại).
- Bản đẩy có số thứ tự + thời điểm tạo (Frontend bỏ qua bản cũ hơn, hiện
  thời điểm cập nhật gần nhất). Đẩy mỗi kỳ kể cả khi dữ liệu chưa đổi.
- Mất SSE thì Frontend tự chuyển sang polling `GET /api/network-stats`
  mỗi 60 giây.
- Webhook từ Strapi (khi editor Publish) cũng đi qua vòng lặp này: FastAPI
  nhận tín hiệu rồi đẩy sự kiện để Frontend fetch lại nội dung từ Strapi.

### 5.5. Nhập dữ liệu thử nghiệm vào SQLite

Không có dữ liệu mẫu trong code. Điền dữ liệu thử nghiệm vào các file CSV
trong `scripts/data/` của repo `BE_inventory` (hiện chỉ có dòng header), rồi chạy:

```bash
cd BE_inventory
python scripts/import_csv.py
```

Chạy lại nhiều lần đều an toàn (ghi đè theo khóa chính). Hoặc thao tác trực
tiếp bằng `sqlite3 awing.db`. Database rỗng thì các endpoint trả rỗng/null
và giao diện hiện trạng thái rỗng — là đúng theo thiết kế.

## 6. Strapi CMS + Postgres (trong Docker Compose)

Project Strapi đã có sẵn trong repo, ở `cms/` (Strapi 5.62, TypeScript,
Postgres; đã cài thêm `better-sqlite3` để chạy thử nhanh bằng SQLite khi
không có Postgres). File Compose đã có sẵn ở repo root (`docker-compose.yml`,
gồm 3 service: postgres, strapi, frontend).

### 6.1. Content types (đã khai sẵn trong code)

| Loại | Kiểu | Trường chính |
|---|---|---|
| Article (blog) | Collection Type | title, slug, cover (media), content (rich text), category, SEO component (metaTitle, metaDescription, keywords, ogImage) |
| Case Study | Collection Type | title, industry, metricLabel, metricValue, cover, summary, SEO |
| Product | Collection Type | name, slug, description, cover, link, SEO |
| Home | Single Type | heroTitle, heroSubtitle, statsNote, howItWorks (component lặp: stepTitle, stepText), SEO |

Định nghĩa nằm trong `cms/src/api/<tên>/content-types/` và component dùng
chung trong `cms/src/components/shared/` (`seo`, `how-it-works-step`).
Tất cả đều bật **Draft & Publish**: chỉ bản published mới tới Frontend.
Muốn thêm/sửa trường thì sửa file schema rồi khởi động lại Strapi (hoặc
dùng Content-Type Builder trong admin — Strapi tự ghi lại file schema).
Bật **i18n** nếu sau này cần đa ngôn ngữ VI/EN.

### 6.2. Quyền API public và webhook — tự động qua bootstrap

Không cần bấm tay trong admin. `cms/src/index.ts` chạy mỗi lần Strapi khởi
động:

- Cấp quyền `find`/`findOne` cho role Public trên cả 4 content type (chỉ
  đọc, không ghi). Chưa có quyền thì Frontend gọi Strapi sẽ nhận 403.
- Nếu có biến `STRAPI_WEBHOOK_URL` thì tạo webhook `awing-backend` (sự kiện
  `entry.publish`, `entry.unpublish`, `entry.update`) để Strapi báo cho
  backend FastAPI khi editor publish — backend đẩy sự kiện qua SSE để
  Frontend fetch lại nội dung. Webhook chỉ mang tín hiệu "nội dung đổi rồi"
  — Strapi vẫn là nguồn sự thật cho nội dung; FastAPI không lưu copy nội
  dung. URL mặc định trong Compose:
  `http://host.docker.internal:8000/api/webhooks/strapi` (Strapi trong
  container gọi backend trên host qua `host.docker.internal`).

### 6.3. Chạy bằng Docker Compose

```bash
cp .env.example .env   # sửa các secret trong .env trước khi chạy thật
docker compose up --build -d
docker compose logs -f strapi   # xem log tới khi Strapi báo sẵn sàng
```

Lần đầu mở admin (`http://localhost:1337/admin`), tạo tài khoản admin đầu
tiên trên giao diện — giữ kỹ tài khoản này. Sau đó vào admin tạo nội dung
(Article / Case Study / Product / Home) và bấm Publish.

**Backup:** volume `postgres-data` (database) và `strapi-uploads` (ảnh
upload) — backup cả hai trước khi nâng cấp Strapi hay sửa Compose.

Lưu ý: máy dựng (VM này) không có Docker nên chưa chạy được `docker compose
up` tại đây. Đã kiểm chứng thay bằng SQLite: Strapi khởi động được, 4 API
trả 200 với dữ liệu rỗng (không 403), bootstrap cấp đủ 8 quyền public và
tạo đúng webhook `awing-backend`; Frontend build standalone chạy được
(`node .next/standalone/server.js`, 3 route trả 200); file Compose kiểm tra
cú pháp YAML hợp lệ. Lần chạy Compose thật đầu tiên vẫn cần kiểm tra lại
trên máy có Docker.

### 6.4. Chạy Strapi trực tiếp trên host (không dùng Compose)

Cần Postgres đang chạy, hoặc SQLite để thử nhanh:

```bash
cd cms
npm install
cp .env.example .env   # sửa secret khi cần
npm run develop        # http://localhost:1337/admin

# Thử nhanh bằng SQLite (không cần Postgres):
DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/data.db npm run develop
```
cấp Strapi hay sửa Compose.

## 7. Thứ tự chạy toàn bộ (checklist)

1. `cp .env.example .env` (sửa secret) rồi `docker compose up --build -d`
   — Postgres + Strapi + Frontend lên cùng lúc. Content types, quyền Public
   và webhook đã có sẵn trong code (mục 6.1–6.2), không cần tạo tay. Mở
   `http://localhost:1337/admin`, tạo tài khoản admin đầu tiên, đăng 1 bài
   Article và 1 Case Study rồi bấm Publish thử.
2. Chạy FastAPI trên host từ repo `BE_inventory` (mục 5.2). Kiểm tra nhanh:
   ```bash
   curl http://localhost:8000/api/network-stats
   curl http://localhost:8000/api/coverage
   curl http://localhost:1337/api/case-studies
   ```
   Chưa có dữ liệu thì các endpoint trả `null` / mảng rỗng — là đúng.
   Strapi trả 403 ở bước này nghĩa là bootstrap chưa cấp quyền (xem log
   Strapi: `docker compose logs strapi`).
3. Mở `http://localhost:3000` (Frontend trong Compose):
   - Chưa có dữ liệu: trang chủ hiện empty state ở dải số liệu và heatmap,
     không có số liệu bịa.
   - Có dữ liệu trong SQLite: số liệu + heatmap hiện; đổi dữ liệu trong
     SQLite thì số liệu tự cập nhật trong vòng 1 phút (SSE/polling).
   - Nội dung Strapi đã Publish: case study hiện ở `/advertisers`.
4. Thử luồng realtime: sửa một con số trong SQLite, xem dải số liệu ở trang
   chủ đổi trong vòng ~1 phút mà không cần reload. Thử luồng publish:
   Publish một Case Study mới trên Strapi, xem lưới case study ở
   `/advertisers` đổi sau khi Frontend fetch lại (không cần deploy lại).

## 8. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Trang chủ hiện empty/error state | Backend chưa chạy, hoặc SQLite chưa có dữ liệu | Chạy FastAPI (mục 5), thêm dữ liệu vào SQLite. Đây là hành vi đúng, không phải lỗi. |
| Nút đăng nhập Google bị mờ | `NEXT_PUBLIC_API_BASE_URL` chưa cấu hình, hoặc backend chưa có `/api/auth/google` | Cấu hình `.env.local`, dựng endpoint auth ở backend. |
| Frontend gọi Strapi trả 403 | Quên bật quyền Public | Mục 6.3: bật `find`/`findOne` cho role Public. |
| Frontend gọi Strapi trả 404 | Sai tên content type / chưa Publish bài | Kiểm tra slug trong Content-Type Builder; bài phải ở trạng thái Published. |
| Publish trên Strapi mà Frontend không đổi | Webhook chưa tới FastAPI, hoặc Frontend chưa fetch lại | Kiểm tra URL webhook (mục 6.4), log FastAPI; thử reload trang để kiểm tra nội dung đã Publish chưa. |
| `docker compose up` lỗi kết nối Postgres | Strapi chạy trước khi Postgres sẵn sàng | `docker compose down` rồi `up` lại; kiểm tra `DATABASE_HOST=postgres` và password khớp hai service. |
| Lỗi Node version khi chạy Strapi | Node không phải LTS | Dùng Node 22 hoặc 24 LTS (`node -v` kiểm tra). |
| Cổng 3000/8000/1337 đã có tiến trình khác | Trùng cổng | Đổi cổng trong lệnh chạy (Frontend: `npm run dev -- -p 3001`; FastAPI: `--port 8001` và sửa `.env.local` theo). |

## 9. Ghi chú deploy (tóm tắt)

- Frontend: deploy Vercel hoặc bất kỳ host Node nào; set 2 biến
  `NEXT_PUBLIC_API_BASE_URL` và `NEXT_PUBLIC_STRAPI_URL` trỏ về domain thật.
- FastAPI: chạy trên VPS/host có Python, dùng systemd hoặc PM2 giữ tiến
  trình; đặt sau reverse proxy (Nginx/Caddy) nếu cần HTTPS.
- Strapi + Postgres: chạy bằng Compose trên cùng VPS (hoặc tách máy);
  backup định kỳ 2 volume `postgres-data` và `strapi-uploads`.
