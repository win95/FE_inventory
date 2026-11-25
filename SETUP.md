# Hướng dẫn setup — AWING Home Public (FE_inventory)

Hướng dẫn chạy toàn bộ hệ thống: Frontend Next.js + backend FastAPI + SQLite +
Strapi CMS + Docker Compose. Đọc hết mục 1 (trạng thái) trước khi chạy.

## 1. Trạng thái hiện tại — cái gì đã có, cái gì chưa

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Frontend Next.js (repo `win95/FE_inventory`) | ✅ Xong, đã push | 5 route: `/`, `/advertisers`, `/contact`, `/locations`, `/icon.svg`. `npm run lint` sạch, `npm run build` pass. Chạy được cả bằng `npm run dev` lẫn Docker Compose. |
| Backend FastAPI + SQLite | ✅ Đã có code (repo riêng `win95/BE_inventory`) | Chạy trên host theo mục 5. Chưa có dữ liệu thật trong SQLite — cần nhập dữ liệu thử nghiệm (mục 5.5) thì các khối mới hiện số. |
| Strapi CMS + Postgres | ✅ Đã có code (`cms/` + `docker-compose.yml` trong repo này) | Content types, quyền Public và webhook đã khai sẵn trong code (mục 6.1–6.2). Chưa có bài viết nào — cần tạo nội dung và Publish thì các khối nội dung mới hiện. |
| Dữ liệu SQLite / Strapi | ❌ Chưa có | Database rỗng → giao diện hiện trạng thái rỗng/lỗi rõ ràng, không tự điền số. Đây là hành vi đúng theo thiết kế, không phải lỗi. |

## 2. Tổng quan kiến trúc (mô hình lai đã chốt)

```text
Người dùng ──► Next.js Frontend (:3000) ──► FastAPI + SQLite (:8000, chạy trên host)
                 │  (BFF: mọi gọi nghiệp vụ qua /api/backend/* trên cùng origin)
                 └────────────────────────► Strapi CMS (:1337) + Postgres (:5432)
                                          (chỉ phía server; ảnh CMS qua /_next/image)
Editor ────► Strapi Admin (:1337/admin) ── Publish ──► webhook ──► FastAPI
                                                              │ (đẩy sự kiện qua SSE)
                                                              └────► Frontend fetch lại nội dung
```

**Kiến trúc BFF (chốt 24/11/2026, theo yêu cầu của tran): trình duyệt chỉ
nói chuyện với Next.js.** Mọi gọi nghiệp vụ (lead, OTP, newsletter,
contact, search, suggest, SSE, đăng nhập Google) đi qua route handler
`src/app/api/backend/[...path]/route.ts` trên cùng origin — trình duyệt
không bao giờ gọi thẳng FastAPI hay Strapi. `src/lib/api.ts` tự chọn
base: trình duyệt → `/api/backend`, phía server → `BACKEND_URL`
(biến server-only, xem mục 4). Ảnh CMS đi qua `next/image` (`/_next/image`),
không `<img src>` thẳng sang Strapi. CSP `connect-src 'self'`.

Quy tắc đã chốt:

- **Strapi** chỉ lo nội dung + admin: blog, case study, product, nội dung home,
  upload ảnh, SEO cơ bản, Draft/Publish. Editor đăng nhập Strapi admin bằng
  tài khoản riêng.
- **FastAPI + SQLite** lo nghiệp vụ: gợi ý chiến dịch, số liệu mạng lưới,
  heatmap phủ sóng, form Lead/Contact, đăng nhập Google cho người dùng cuối,
  vòng lặp realtime push full snapshot mỗi 30 giây (trễ tối đa 1 phút).
- **Frontend gọi cả hai** — nhưng chỉ phía server: Strapi lấy nội dung,
  FastAPI lo nghiệp vụ, qua BFF (xem sơ đồ trên). Auth tách bạch,
  không gộp JWT hai bên.
- **FastAPI chạy ngoài Docker Compose** (API + dữ liệu thử nghiệm, cần thao
  tác trực tiếp file SQLite trên host). **Strapi + Postgres chạy trong
  Docker Compose.**

Bảng cổng mặc định:

| Dịch vụ | Cổng | Chạy ở đâu |
|---|---|---|
| Frontend Next.js | 3000 | Host (`npm run dev`) hoặc Docker Compose |
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
git clone https://github.com/win95/BE_inventory.git
cd FE_inventory
```

Hai repo: `FE_inventory` chứa Frontend + Strapi CMS + Compose; `BE_inventory`
chứa backend FastAPI + SQLite.

## 4. Frontend Next.js

```bash
npm install
cp .env.example .env.local   # chỉ chạy `npm run dev`; chạy Compose thì copy sang `.env` (mục 6.3)
npm run dev      # http://localhost:3000
```

File `.env.example` ở repo root dùng chung cho cả hai cách chạy: `npm run dev`
đọc `.env.local` (hoặc `.env`), còn `docker compose up` đọc `.env`.

Biến môi trường (xem `.env.example`):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8000` | Backend FastAPI — biến **server-only** (không `NEXT_PUBLIC_*`), chỉ Next.js phía server và proxy `/api/backend` dùng. Để trống ở production = proxy trả 503 `BACKEND_NOT_CONFIGURED`. Local chạy host: `http://localhost:8000`; Frontend trong Docker: `http://host.docker.internal:8000`. |
| `NEXT_PUBLIC_STRAPI_URL` | `http://localhost:1337` | Strapi CMS. Để trống = khối nội dung hiện trạng thái rỗng. |

Kiểm tra:

```bash
npm run lint     # phải sạch, không lỗi
npm run build    # phải pass; route hiện ra gồm /, /advertisers, /contact, /locations, /icon.svg
```

Lưu ý: **chưa có backend thì các mục dữ liệu hiện empty/error state là đúng.**
Nút đăng nhập Google luôn hiện; chưa cấu hình Google OAuth thì bấm vào
backend trả 503 `AUTH_NOT_CONFIGURED`.

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
tự tạo bảng rỗng khi khởi động. Thao tác trực tiếp file này trên host để
thêm/xoá/sửa dữ liệu thử nghiệm.

### 5.3. Hợp đồng API Frontend đang gọi

Base URL: trình duyệt gọi `/api/backend` (cùng origin, proxy sang FastAPI);
phía server gọi `BACKEND_URL`. Tất cả trả JSON. CORS phải mở cho
`http://localhost:3000` (khi chạy local).

| Method | Endpoint | Dùng ở đâu | Ghi chú |
|---|---|---|---|
| `GET` | `/api/network-stats` | Dải số liệu, màn Location Network | `{ connections, provinces, chains, venues }` — null nếu chưa có. |
| `GET` | `/api/coverage` | Heatmap, màn Location Network | `{ provinces: [{ province, level, venues }], venueTypes: [{ type, count }], directory?, industryStats? }`. `directory` = thư mục địa điểm `{ name, category, venues }`; `industryStats` = số liệu theo ngành `{ industry, engagement, reach }`. Hai trường sau không có thì Frontend tự ẩn khối tương ứng. |
| `POST` | `/api/suggest` | Trang `/advertisers` | Body `{ prompt }`. Trả `{ overview: { locations, venues, reach, engagement, offPeak }, locations: [{ name, area, city, reach }], formats: [{ name, metricLabel, metricValue, durationSeconds? }], cities?: [{ name, reach, engagements, impressionsPerDay }] }`. `cities` để chip thành phố bật/tắt tính lại tổng. |
| `POST` | `/api/leads` | Lead form (trang chủ) | Body `{ name, email, phone, message }`. Ghi vào SQLite, trả 200/201 khi nhận. |
| `POST` | `/api/contact` | Form Contact Us (`/contact`) | Body `{ type, name, email, phone, message }`. Ghi vào SQLite. |
| `GET` | `/api/events/stats` | Realtime (SSE) | Server-Sent Events, mỗi sự kiện là một full snapshot `NetworkStats`. Xem mục 5.4. |
| `GET` | `/api/auth/google` | Nút đăng nhập Google | Bắt đầu luồng OAuth Google, callback về Frontend. Cần `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (tạo trên Google Cloud Console) và redirect URI khớp với cấu hình. |
| `POST` | `/api/webhooks/strapi` | Nhận webhook từ Strapi | Xem mục 6.2. |

Case study **không** qua backend này: Frontend lấy qua Strapi REST
(`GET /api/case-studies` trên Strapi, chỉ bản published), theo ranh giới
đã chốt ở Plan §6.

### 5.4. Realtime — vòng lặp backend push full data (đã chốt)

- Một tác vụ nền chạy trong chính tiến trình FastAPI, mỗi kỳ **30 giây**:
  đọc SQLite, dựng **full snapshot** của số liệu (F03), phủ sóng (F04) và
  reach/engagement (F06), đẩy qua SSE xuống mọi Frontend đang kết nối.
- Frontend thay toàn bộ khối hiển thị, không cộng dồn hay vá từng trường.
- Ngân sách trễ: chu kỳ 30 giây + vài giây xử lý ≈ 35–40 giây, trong giới
  hạn 1 phút đã chốt. Kỳ nào lỗi thì ghi log bỏ qua, kỳ sau tự bù toàn bộ
  (không cần cơ chế phát lại).
- Mỗi bản đẩy là full snapshot 4 số liệu (connections, provinces, chains,
  venues) — Frontend thay toàn bộ khối hiển thị. Đẩy mỗi kỳ kể cả khi dữ
  liệu chưa đổi.
- Mất SSE thì Frontend tự chuyển sang polling `GET /api/network-stats`
  mỗi 60 giây.
- **Số liệu tăng dần theo thời gian thực (tran 18/11/2026):** trước khi đẩy
  snapshot mỗi kỳ, backend cộng dồn số liệu vào SQLite (`app/growth.py`) —
  Lượt kết nối +13/kỳ mặc định (`GROWTH_CONNECTIONS_PER_CYCLE`), reach /
  engagements / impressions/ngày / monthly tăng theo cùng tỉ lệ % so với
  tổng hiện tại, chia theo tỉ trọng từng thành phố. Số được lưu lại nên
  restart backend vẫn tiếp tục tăng; cột NULL giữ NULL (Vũng Tàu/Huế không
  tự sinh số). Đây là số tăng tổng hợp cho dữ liệu mẫu — khi có nguồn số
  liệu thật thì tắt bằng `GROWTH_ENABLED=false`. Frontend nhận số mới qua
  SSE: dải số liệu ở home cập nhật trực tiếp từ snapshot; /advertisers và
  /locations gọi lại API khi có snapshot mới (lần gọi lại gửi
  `logPrompt: false` nên không ghi trùng vào `prompt_logs`), lựa chọn chip
  thành phố và bộ lọc thư mục được giữ nguyên khi refresh.
- Webhook từ Strapi (khi editor Publish) không đi qua vòng lặp 30 giây:
  FastAPI nhận webhook rồi đẩy ngay một sự kiện `content-updated` qua SSE
  để Frontend fetch lại nội dung từ Strapi.

### 5.5. Nhập dữ liệu thử nghiệm vào SQLite

Không có dữ liệu mẫu trong code — dữ liệu mẫu nằm trong các file CSV ở
`scripts/data/` của repo `BE_inventory` (47 dòng, 8 file; số liệu theo
trang mẫu AWING trên Figma, nhất quán với nhau: tổng venues của
`provinces` và `venue_types` đều bằng 10.953). Nhập vào SQLite:

```bash
cd BE_inventory
python scripts/import_csv.py
```

Chạy lại nhiều lần đều an toàn (ghi đè theo khóa chính). Hoặc thao tác trực
tiếp bằng `sqlite3 awing.db`. Database rỗng thì các endpoint trả rỗng/null
và giao diện hiện trạng thái rỗng — là đúng theo thiết kế.

### 5.6. Đăng nhập Google (SSO)

Luồng OAuth 2.0 chuẩn, code backend đã có sẵn (`app/routers/auth.py` trong
repo `BE_inventory`): `GET /api/auth/google` chuyển tới Google → Google
callback về `/api/auth/google/callback` → backend đổi code lấy thông tin
người dùng, lưu/cập nhật bảng `users`, phát JWT (24h) rồi chuyển về
Frontend kèm `?auth_token=...`. Frontend (`src/lib/auth.ts` +
`src/components/AuthSession.tsx`) đọc token đó, lưu vào localStorage
(`awing_auth_token`), dọn sạch khỏi URL rồi hiện tên/email + nút Đăng xuất
ở header. Các API hiện tại chưa yêu cầu xác thực nên token mới chỉ dùng để
hiển thị trạng thái đăng nhập; khi có endpoint cần xác thực thì gửi kèm
header `Authorization: Bearer <token>`.

Còn 2 việc làm tay (không làm bằng code được):

1. **Tạo OAuth client trên Google Cloud Console** (tài khoản Google của
   tran): tạo project → OAuth consent screen → Create OAuth client ID,
   loại Web application → Authorized redirect URI đúng bằng
   `{FRONTEND_ORIGIN}/api/backend/auth/google/callback` (local:
   `http://localhost:3100/api/backend/auth/google/callback`). Lấy Client ID và
   Client Secret.
2. **Đặt vào `.env` của backend** (`BE_inventory/.env`):
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` (giá trị ngẫu
   nhiên, dài) và `FRONTEND_ORIGINS` (danh sách origin, phần tử đầu là origin
   dùng cho redirect) phải khớp đúng redirect URI đã đăng ký với Google —
   sai một ký tự Google cũng từ chối callback. **Lưu ý: `JWT_SECRET` là
   bắt buộc — backend từ chối khởi động nếu thiếu (fail-closed, 24/11/2026);
   `PUBLIC_BASE_URL` đã bỏ, không dùng nữa.**

Chưa cấu hình thì nút đăng nhập ở header hiện trạng thái disable rõ ràng,
và `GET /api/auth/google` trả 503 `AUTH_NOT_CONFIGURED`. Editor đăng nhập
Strapi admin bằng tài khoản Strapi riêng — hai hệ phiên độc lập, không
dùng chung JWT này.

## 6. Strapi CMS + Postgres (trong Docker Compose)

Project Strapi đã có sẵn trong repo, ở `cms/` (Strapi 5.62, TypeScript,
Postgres). File Compose đã có sẵn ở repo root (`docker-compose.yml`,
gồm 3 service: postgres, strapi, frontend). `better-sqlite3` không nằm
trong `package.json` — image Docker không build native module này (trong
Compose Strapi dùng Postgres); chỉ khi chạy thử bằng SQLite trên host mới
cần cài tay (mục 6.4).

### 6.1. Content types (R1-1, BE 1-10 — 13 loại, xem chi tiết `cms/README.md`)

| Loại | Kiểu | Trường chính |
|---|---|---|
| Article (= News) | Collection Type | title, slug, cover (media), content (rich text), category, publishedDate, market, SEO |
| Case Study | Collection Type | title, industry, metricLabel, metricValue, cover, summary, market, SEO |
| Product | Collection Type | name, slug, tagline, goal, description, color (enum 6 màu sản phẩm), order, cover, link, solutions (relation), blocks (dynamic zone), market, SEO |
| Solution | Collection Type | name, slug, product (relation), summary, blocks (dynamic zone), market, SEO |
| Ad Format | Collection Type | name, slug, durationSeconds, metricLabel, metricValue, description, solution (relation), market, SEO |
| Resource | Collection Type | title, slug, type (report/paper/case-study), summary, content, cover, file (PDF), publishedDate, market, SEO |
| Event | Collection Type | title, slug, description, startDate, endDate, mode, location, agenda, speakers, cover, market, SEO |
| Job | Collection Type | title, slug, department, location, type, description, requirements, deadline, market, SEO |
| Partner | Collection Type | name, slug, logo, website, category, description, market |
| Customer | Collection Type | name, slug, logo, industry, testimonial, caseStudy (relation), market |
| Data Snapshot | Single Type | snapshotDate, metrics (JSON), note |
| Global | Single Type | siteName, contactEmail, defaultSeo, socialLinks |
| Home | Single Type | heroTitle, heroSubtitle, statsNote, howItWorks (component lặp: stepTitle, stepText), SEO |

Định nghĩa nằm trong `cms/src/api/<tên>/content-types/`, component dùng
chung trong `cms/src/components/shared/` (`seo`, `how-it-works-step`,
`event-agenda-item`, `event-speaker`, `social-link`) và block components
trong `cms/src/components/blocks/` (10 block của FE 9).
Tất cả đều bật **Draft & Publish**: chỉ bản published mới tới Frontend.
Muốn thêm/sửa trường thì sửa file schema rồi khởi động lại Strapi (hoặc
dùng Content-Type Builder trong admin — Strapi tự ghi lại file schema).
i18n EN + VI đã bật cho mọi loại (xem §6.6); trường `market` (enum
vn/global/id/th, mặc định vn) có trên mọi Collection Type.

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

# Thử nhanh bằng SQLite (không cần Postgres) — cài better-sqlite3 tay trước
# vì nó không nằm trong package.json (để image Docker không phải build native):
npm install --no-save better-sqlite3
DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/data.db npm run develop
```

### 6.5. MCP server tích hợp sẵn (Strapi 5.47+, GA 5.49)

Strapi có sẵn MCP server, đã bật trong `cms/config/server.ts`
(`mcp.enabled`, mặc định bật; đặt `STRAPI_MCP_ENABLED=false` để tắt).
Endpoint: `POST http://localhost:1337/mcp` (chỉ nhận POST — GET trả 405),
xác thực bằng admin API token (`Authorization: Bearer <token>`). Tool tự
sinh theo từng content type (Article, Case Study, Product, Home) nên agent
có thể đọc/ghi nội dung CMS qua MCP thay vì chỉ gọi REST.

Tạo token trong Strapi admin: Settings → Global settings → API Tokens →
Create new API Token (chọn Full access hoặc giới hạn theo nhu cầu) — token
chỉ hiện một lần lúc tạo, lưu kỹ. Chưa có token thì mọi request tới `/mcp`
đều trả 401 `Authentication required` (đã kiểm chứng: Strapi khởi động
báo `[MCP] Server available at /mcp`; POST không token và POST token sai
đều 401; GET 405).

### 6.6. Đa ngôn ngữ (i18n) — EN + VI

i18n bật cho cả 4 content type (`pluginOptions.i18n.localized: true` trong
mỗi schema). Các trường chữ (title, slug, content, category, summary,
description, heroTitle, heroSubtitle, statsNote, howItWorks, SEO) có bản
riêng theo locale; ảnh (cover, ogImage), số (metricValue) và link (Product)
dùng chung cho mọi locale.

Bootstrap trong `cms/src/index.ts` tự tạo 2 locale `en` (English) và `vi`
(Tiếng Việt) rồi đặt **`vi` làm locale mặc định** — site tiếng Việt trước,
tiếng Anh là bản dịch. Không cần tạo locale tay. Kiểm chứng: Strapi khởi
động ghi log `[bootstrap] Đã tạo locale: vi (Tiếng Việt)` và `[bootstrap]
Đã đặt locale mặc định: vi`; `GET /api/articles?locale=vi` và `?locale=en`
đều trả 200.

Đọc theo locale qua REST: `GET /api/articles?locale=vi` hoặc `?locale=en`
(không truyền `locale` thì trả locale mặc định `vi`). Tạo bản dịch trong
admin: mở một entry, chọn locale ở góc trên bên phải, bấm tạo bản dịch rồi
Publish từng locale riêng.

### 6.7. Nút EN/VN trên Frontend — đã xong

Nút EN trên header giờ chuyển ngôn ngữ thật (locale `vi` mặc định, lưu
`localStorage` key `awing_locale`): `src/components/LocaleProvider.tsx`
dùng `useSyncExternalStore`, `src/lib/i18n.ts` là từ điển UI (vi là gốc,
en phải đủ mọi key — TypeScript kiểm tra lúc build). Mọi fetch đều mang
locale theo: FastAPI `GET /api/coverage?locale=`, `POST /api/suggest`
(body `{prompt, locale}`), Strapi `GET /api/case-studies?populate=cover&locale=`.
Metadata trong `layout.tsx` vẫn tiếng Việt (Next metadata tĩnh theo build).

**Dịch hết theo từng mode (18/11/2026, theo yêu cầu của tran):** mọi chữ
người dùng thấy đều dịch theo locale — tiêu đề/nhãn theo Figma, nút
Edit/Update/Share/Save, "TÌM HIỂU NGAY →" (en: "Learn more →"), tiêu đề
popup, nhãn thang heatmap, tên ngành/loại venue/nhóm thư mục/mô tả format
(backend dịch trong `app/locale_names.py` — `VENUE_TYPE_VI`,
`DIRECTORY_CATEGORY_VI`, `INDUSTRY_VI`, `FORMAT_DESCRIPTION_VI`,
`METRIC_LABEL_VI`). Chỉ giữ nguyên: tên riêng (tên chuỗi, tên format,
địa chỉ) và ghi chú kỹ thuật "AWING — Home Public (FE_inventory)" ở
footer. Lưu ý: chip lọc thư mục ở /locations lấy nhãn theo locale hiện
tại (`DIRECTORY_CATEGORIES[locale]`), và bộ lọc theo ngôn ngữ cũ được
coi như chưa lọc khi đổi locale.

### 6.8. Màn /advertisers — khớp Figma hoàn toàn (18/11/2026)

Desktop rộng: 2 cột — trái Suggested Locations + Suggested Ad Formats,
phải Case Studies; màn hẹp: 1 cột. Không có h1, không có Campaign Overview,
không có thẻ venue (đã bỏ theo quyết định của tran).

- Chip thành phố: 8 chip (từ `city_stats`, kể cả Vũng Tàu/Huế chưa có số
  liệu — chỉ hiện tên); chỉ chip đã chọn mới hiện số = monthly engagements;
  mặc định chọn top 3 theo monthly engagements (HCMC/Ha Noi/Da Nang →
  22,8M/15,7M/4,7M). Tổng Potential Engagements = tổng monthly engagements
  của các chip đã chọn. Đổi locale sẽ refetch nhưng KHÔNG reset lựa chọn
  (selection guard: chỉ khởi tạo top 3 khi `selectedCities === null`).
- Formats: 4 thẻ theo đúng thứ tự CSV `ad_formats` (Bumper Ads, Banner /
  Slide, Text Matching, Video Full Screen), metric "Engagement", mỗi thẻ
  có mô tả + badge thời lượng + nút Play (mở popup xem trước) + nút đỏ
  "TÌM HIỂU NGAY →" (link /contact). Khối ảnh hiện là gradient giữ chỗ —
  ảnh creative thật là file nhị phân, không push được qua snapshot flow;
  khi có asset thì thay khối gradient trong `AdFormatCard`.
- Case Studies: thẻ có banner ảnh (cover từ Strapi, không có thì gradient),
  tên + ngành phủ trên ảnh, headline đỏ `+{metricValue}% {metricLabel}`
  (quy ước nhập liệu: metricValue là % tăng, vd. 340 + "Brand Recall" →
  "+340% Brand Recall"), mô tả (summary), link xem đầy đủ (mở popup
  yêu cầu tài khoản advertiser). Chưa có bài published trên Strapi thì
  hiện trạng thái rỗng. Footer ẩn ở trang này (Figma không có footer).

### 6.9. R1-1: route /vi–/en, data layer Strapi, SEO framework (23/11/2026)

- **Route locale (FE 4):** mọi trang nằm dưới `src/app/[locale]/`
  (`/vi`, `/en`, `/vi/advertisers`...). `src/middleware.ts` chuyển đường
  dẫn không tiền tố về `/{locale}` (ưu tiên cookie `awing_locale` do nút
  EN/VI ghi, mặc định vi — không chuyển hướng theo IP). Locale lấy từ URL,
  không còn từ localStorage; `LocaleProvider` nhận `locale` từ layout.
  Mọi link nội bộ dùng `withLocale(path, locale)` trong `src/lib/i18n.ts`.
- **Token mới (FE 3, Docs §7.2):** `src/app/globals.css` dùng đỏ logo
  #D2232A, 6 màu sản phẩm (`--color-p-*`), font Be Vietnam Pro (tiêu đề)
  + Inter; token Figma cũ (#E8212B, Barlow Condensed) đã bỏ.
- **Data layer Strapi (FE 5):** `src/lib/strapi.ts` là client duy nhất cho
  CMS — có type, lọc `locale` (+ `market` khi BE 5 thêm trường market),
  fetch gắn tag `strapi:<collection>` khi chạy phía server; `src/lib/api.ts`
  chỉ còn client FastAPI và re-export `fetchCaseStudies` /
  `isStrapiConfigured` / `STRAPI_BASE_URL` nên import cũ không đổi.
  `ApiError` tách sang `src/lib/errors.ts`.
- **Revalidate (FE 5):** `POST /api/revalidate` với body
  `{ secret, tag?, path? }`; secret lấy từ `REVALIDATE_SECRET` (để trống
  thì 503, sai secret thì 401). FastAPI gọi endpoint này sau khi nhận
  webhook publish của Strapi (BE 8) — không trỏ thẳng webhook Strapi vào
  đây. Tag theo quy ước `strapi:<collection>`.
- **SEO (FE 6):** `src/lib/seo.ts` — `pageMetadata()` (canonical tự trỏ +
  hreflang vi/en/x-default + Open Graph), JSON-LD Organization + WebSite
  gắn ở `[locale]/layout.tsx` (SearchAction thêm ở R1-5 khi `/search` có
  thật). `src/app/sitemap.ts` (4 route tĩnh × 2 locale) và
  `src/app/robots.ts` (chặn `/api/`) — route động bổ sung ở R1-3/R1-4.
  Domain lấy từ `NEXT_PUBLIC_SITE_URL` (mặc định https://awing.vn).
  Mỗi trang hiện tại có đúng 1 h1 (riêng /advertisers không có h1 theo
  Figma). Lưu ý: `lang` của `<html>` trong HTML trả về vẫn là `vi`
  (layout gốc tĩnh); `LocaleProvider` đổi `document.documentElement.lang`
  theo locale ngay khi hydrate — SSR lang theo locale cần đưa layout
  `[locale]` lên làm layout gốc, để sau nếu cần.
- **Biến mới trong `.env.example`:** `NEXT_PUBLIC_SITE_URL`,
  `REVALIDATE_SECRET` (đặt giá trị ngẫu nhiên dài; chỉ dùng phía server).

### 6.10. R1-1: component dùng chung + block renderer + motion (FE 7-10, 23/11/2026)

- **Component cơ bản (`src/components/ui/`):** Button (primary/outline/ghost/
  subtle/light; href nội bộ → Next Link), Input, Select (select gốc), Tabs
  (phím mũi tên đổi tab), Breadcrumb, Pagination (cửa sổ số trang),
  Modal + Drawer (đóng bằng Escape/bấm nền, khóa cuộn body — hai modal cũ
  AdvertiserAuthModal/FormatPreviewModal chưa có Escape, giữ nguyên tới khi
  làm lại trang của chúng), Toast (`toast(msg)` + ToastViewport gắn ở layout).
- **Component nội dung (`src/components/content/`):** ProductCard (theme màu
  sản phẩm theo §7.2, href tuỳ chọn), ContentCard (cover hoặc gradient),
  StatsCard (xu hướng tăng/giảm), LockedState (nội dung khoá, CTA về
  /contact — R2 sẽ trỏ sang lead form popup).
- **Block renderer (`src/components/blocks/BlockRenderer.tsx`, FE 9):** render
  danh sách block Strapi dynamic zone (hero, opportunity, solutions,
  how-to-plan, showcase, lead-form, rich-text, media, stats, cta); block lạ
  hiện khung báo thay vì crash. Rich text nhận plain text (không HTML —
  tránh sanitize; ánh xạ JSON rich text của Strapi làm cùng BE 6).
- **Motion (FE 10):** Reveal (hiện dần khi cuộn tới, 300ms; không JS hoặc
  bật giảm chuyển động thì nội dung vẫn hiện), Counter (đếm tới giá trị đích
  khi cuộn tới; không dùng cho số liệu realtime vì SSE tick liên tục),
  `usePrefersReducedMotion`, và khối `@media (prefers-reduced-motion: reduce)`
  trong `globals.css`. Home bọc Reveal cho StatsStrip, LocationIntelligence,
  HowItWorks. Hiệu ứng ribbon logo (Docs §7.4) chưa làm — cần thiết kế motion
  từ Figma, không đoán.
- **Trang tài liệu component:** `/vi/components` (và `/en/components`) — xem
  + thử mọi component trên, kèm demo BlockRenderer đủ 10 loại block + 1
  block lạ. Trang nội bộ: không có trong sitemap, không link từ nav.

### 6.11. R1-1: bảo mật FE, tracking GTM, 301, trang lỗi (FE 11-14, 23/11/2026)

- **Security headers (FE 11, `next.config.ts`):** CSP, nosniff,
  X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, HSTS. CSP cho
  phép `unsafe-inline` cho script/style (Next hydrate + JSON-LD inline +
  Tailwind) và `connect-src` tới origin FastAPI + Strapi đọc từ env
  (dev không env thì thêm localhost:8000/1337) — đổi env API là phải
  build/chạy lại để CSP nhận origin mới, nếu không fetch/SSE bị chặn.
- **Sanitize (FE 11, `src/lib/sanitize.ts`):** DOMPurify, chỉ chạy ở client.
  Dùng khi block rich-text / nội dung Strapi render HTML (R1-3/R1-4); hiện
  tại rich-text chỉ nhận plain text nên chưa gọi tới. Không tự viết sanitize
  bằng regex.
- **Tracking (FE 12):** GTM load ở root layout chỉ khi có
  `NEXT_PUBLIC_GTM_ID` (để trống = tắt hẳn); `trackEvent()` trong
  `src/lib/tracking.ts` đẩy vào `window.dataLayer`. Sự kiện hiện có:
  `lead_form_submit`, `contact_form_submit` — không gửi email/SĐT/họ tên.
- **301 (FE 13):** bảng trong `redirects.json` (hiện 2 dòng: /vi|en/contact-us
  → /vi|en/contact), `next.config.ts` đọc bảng này. Next.js trả **308**
  (Permanent Redirect) cho `permanent: true` — Google coi 308 tương đương
  301. Kiểm tra tự động: `npm run test:redirects [baseUrl]` (chấp nhận
  301/308). Bảng đủ 572 URL do BA lập sau.
- **Trang lỗi + health (FE 14):** `src/app/not-found.tsx` (404 song ngữ,
  link /vi), `src/app/[locale]/error.tsx` (lỗi route + nút Thử lại),
  `src/app/global-error.tsx` (lỗi root layout, style inline riêng),
  `GET /api/health` → `{ status: "ok", time, uptimeSeconds }` (không kiểm
  tra DB/backend — để phân biệt frontend chết hay backend chết).

### 6.12. R1-1: Strapi content model 4 → 13 loại (BE 1-10, 23/11/2026)

- **BE 1 — Strapi 5.62.0 đã là bản mới nhất**, không cần nâng cấp; plugin
  i18n là lõi của Strapi 5, MCP đã bật từ trước (`config/server.ts`).
- **BE 2-4 — 9 loại mới:** Solution, Ad Format, Resource, Event, Job,
  Partner, Customer (Collection) + Data Snapshot, Global (Single). Product
  mở rộng (tagline, goal, color enum 6 màu, order, solutions relation,
  blocks dynamic zone). Article giữ làm **News** (thêm publishedDate) thay
  vì tạo loại News riêng; Case Study thêm `market`.
- **BE 5 — i18n + market:** mọi loại đều localize; trường `market` (enum
  vn/global/id/th, mặc định vn) trên mọi Collection Type.
- **BE 6 — dynamic zone:** 10 block component trong
  `cms/src/components/blocks/` (hero, opportunity, solutions, how-to-plan,
  showcase, lead-form, rich-text, media, stats, cta) — đúng danh sách của
  FE 9 `BlockRenderer`. Product và Solution có trường `blocks`.
- **Verify 23/11:** `npx tsc --noEmit` sạch; boot Strapi develop trên DB
  SQLite tạm — 10 collection đều `GET /api/<tên>?locale=vi|en` → 200
  (rỗng), 3 Single Type → 404 (đúng, chưa có bản ghi); bootstrap cấp đủ
  quyền public cho 9 loại mới; kiểm tra bảng SQLite: đủ bảng cho 9 loại +
  15 block component + 3 shared component mới + bảng nối relation.
- **Chưa xong:** BE 7 migrate 118 bài news + 12 FAQ — cần bản xuất dữ liệu
  từ site cũ (chưa có). BE 8: webhook Strapi → FastAPI đã có; phía FastAPI
  dịch webhook thành lời gọi revalidate sang Next.js là việc của repo
  BE_inventory. BE 9 (media object storage + CDN) và BE 10 (bảo mật admin
  IP/VPN + role Editor/Author) là việc hạ tầng khi triển khai.

### 6.13. R1-2: header/footer + lead form (FE 15-21, BE 11-14, 23/11/2026)

Làm trên nhánh `r1-2` (tách từ main 89e8882/5a9eb91c). Toàn bộ R1-1 chưa
push nên nhánh này mang theo cả R1-1.

- **FE 15-17 — Header + toolbar + mobile:** menu cũ (Platform/Advertisers/
  Wi-Fi Partners/About Us/Media) thay bằng IA Docs §4.1: Products (mega
  menu 6 cột theo màu sản phẩm, mỗi cột tên + slogan + solutions), Data /
  Insights & Resources / Company (dropdown, đóng bằng Escape + bấm ngoài).
  Thanh công cụ: nút Search (mở lớp phủ), Sign in (dropdown 2 lựa chọn —
  ACM/AAP mờ vì SSO ở R4, tài khoản website qua Google như cũ), nút EN/VI,
  nút đỏ Get data (mở dialog lead). Mobile: nút hamburger mở Drawer (menu
  theo nhóm + tìm kiếm + đổi ngôn ngữ + Get data) và thanh CTA cố định
  dưới màn hình (Get data + Talk to us); layout chừa `pb-16 md:pb-0`.
  `SiteChrome` gom Header + SearchOverlay + LeadDialog + MobileBottomBar
  để chia sẻ trạng thái mở/đóng. Trang chưa có (R1-3/R1-4) hiện mờ + không
  bấm được; chỉ /locations, /advertisers, /contact là link thật.
- **FE 16 — Search overlay (vỏ R1-2):** gõ để lọc ngay trong danh mục tĩnh
  (6 sản phẩm, 26 solution, 4 trang đã có) — không dấu, khớp cả từ khóa
  tiếng Anh lẫn tiếng Việt (vd. gõ "heatmap" ra "Bản đồ nhiệt"). Tìm kiếm
  đầy đủ qua API FastAPI ở R1-5 (FE 45-47).
- **FE 18 — Footer 5 cột:** Thương hiệu (logo + giới thiệu + mạng xã hội
  — chưa có URL thật, SOC-01 chưa chốt, hiện mờ) | Sản phẩm (6 link, mờ
  tới R1-3) | Dữ liệu & Tài nguyên | Công ty + Hỗ trợ (FAQ, bảo mật, điều
  khoản, Cài đặt cookie mở modal giải thích tracking đang tắt) | Liên hệ
  (văn phòng + form nhận tin → `POST /api/newsletter` + chọn thị trường
  awing.vn / awing.global · ID (R4) + đổi ngôn ngữ). Vẫn ẩn trên
  /advertisers. Dọn 7 key i18n chết của header cũ (nav.platform,
  nav.advertisers, nav.wifiPartners, nav.about, nav.media, nav.partners,
  footer.quickLinks).
- **FE 19-21 — Lead form dùng chung** (`LeadForm`, 2 chế độ embedded/popup):
  bắt buộc họ tên/công ty/email/SĐT (E.164 — gõ 0xxx tự đổi sang +84...),
  tùy chọn ngành (Retail/F&B/FMCG/Finance/Healthcare/Automotive),
  thương hiệu, khu vực (6 chip), ghi chú; đồng ý tách 2 mục đích (liên hệ
  bắt buộc, nhận tin tùy chọn); cảnh báo email cá nhân (không chặn);
  UTM đọc từ URL + source (CTA đã mở form) + language/market là trường ẩn.
  Luồng 3 bước: nhập thông tin → OTP 6 số qua email → bổ sung hồ sơ (chỉ
  hiện trường tùy chọn còn trống, lưu qua PATCH kèm lead token; xong có
  nút Đóng). Turnstile: có `NEXT_PUBLIC_TURNSTILE_SITE_KEY` thì widget
  thật, chưa có thì hiện "mô phỏng" và backend chấp nhận (ghi log).
  `LeadForm` dùng chung `id` theo chế độ (`lead-…` / `lead-popup-…`) vì
  trang Home render cả form nhúng lẫn dialog.
- **BE 11-14 (repo BE_inventory):** `POST /api/leads` mở rộng (validate
  E.164, Turnstile, lưu lead + UTM + nhật ký đồng ý `lead_consents`, chống
  trùng email chưa xác thực trong 10 phút, rate limit 5/phút/IP);
  `POST /api/leads/{id}/verify` (OTP 6 số, hash SHA-256, hiệu lực 10 phút,
  tối đa 5 lần sai, cấp JWT lead 60 phút; chỉ lead đã xác thực mới vào
  hàng đợi CRM); `POST /api/leads/{id}/resend` (cooldown 60s, tối đa 5
  mã/ngày); `PATCH /api/leads/{id}` (cần Bearer lead token);
  `POST /api/newsletter` (202, trùng email vẫn 202). Email + CRM + Turnstile
  đều **giả lập** (ghi log) theo quyết định fake API/data — xem README của
  BE_inventory. Worker CRM trong tiến trình chạy mỗi 30s (cùng mẫu vòng lặp
  realtime).
- **2 lỗi CORS đã sửa trong lúc verify:** Chrome gửi preflight kèm
  `Access-Control-Request-Private-Network` khi trang ở 127.0.0.1 gọi API
  cổng khác — Starlette trả 400 nếu thiếu `allow_private_network=True`
  (làm form lead không gửi được từ trình duyệt dù curl vẫn 200);
  `allow_methods` thiếu `PATCH` nên bổ sung hồ sơ bị chặn. Cả 2 đã sửa
  trong `app/main.py` của BE.
- **Verify 23/11 (Playwright, 32/32):** mega menu 6 sản phẩm + solution,
  Escape đóng, dropdown Data/Heatmap sang /locations, search "heatmap" ra
  kết quả và điều hướng, dialog Get data → nhập form (SĐT 090… tự đổi
  +84) → OTP (mã sai báo còn 4 lần thử, mã đúng từ log email giả lập →
  đã xác thực → bổ sung hồ sơ → đã lưu), footer 5 cột + nhận tin thành
  công, mobile drawer + CTA dưới. Lint 0 lỗi; build pass. 5 reqfail
  events/stats + 1 console 400 trong log test là nhiễu kiểm thử: SSE bị
  hủy khi chuyển trang, và 400 là lần nhập mã OTP sai có chủ ý (backend
  log chỉ có 200 cho SSE + 400 cho 2 lần verify sai).
- **Chưa xong:** CRM/email/Turnstile thật (chờ quyết định #1, #4); trang
  /products, /resources, /events, /news, /about, /careers (R1-3/R1-4) —
  link trong menu/footer hiện mờ tới lúc đó. (BE 7 và BE 8 đã xong dạng
  giả lập ở §6.14.)

### 6.14. R1: dữ liệu giả toàn bộ + API BE mới (23/11/2026 — theo lệnh của tran "làm hết R1 + API BE lấy dữ liệu giả lập trong sqlite", "Strapi cũng tạo dữ liệu giả lập trong database")

- **Seed Strapi** (`cms/scripts/seed-fake-content.js`, `npm run seed`,
  `--force` để tạo lại): 6 Product + 26 Solution + 4 AdFormat + 12
  Resource + 6 Event + 118 Article + 6 Job + 8 Partner + 6 Customer +
  3 CaseStudy + 12 FAQ + DataSnapshot + Global + Home — vi + en, đã
  publish. Loại mới: **Faq** (`cms/src/api/faq/`); Partner/Customer thêm
  cờ `consent` (chỉ hiện logo khi đồng ý; seed có 1 partner
  `consent=false` để kiểm tra). Đã kiểm chứng trên SQLite tạm: đủ số
  lượng mọi loại ở cả vi và en qua REST, relation đúng cả 2 locale, 1
  partner consent=false. 2 lưu ý đã kiểm chứng: (1) relation lưu **theo
  từng locale** nên seed đặt relation ở cả vi và en; (2) richtext ở
  project này validate dạng **string** (không phải Blocks JSON) nên seed
  ghi text thuần, FE render bằng cách tách đoạn. Chạy trên máy tran:
  `cd cms && npm run seed` (Postgres trong Compose; idempotent — loại
  nào có dữ liệu thì bỏ qua).
- **BE 8 — webhook → revalidate** (`app/revalidate.py`): FastAPI nhận
  webhook Strapi rồi gọi `POST /api/revalidate` của Frontend với secret
  chung, xóa tag `strapi:<collection>` (vd. article → strapi:articles,
  case-study → strapi:case-studies). Cần `FRONTEND_URL` +
  `REVALIDATE_SECRET` trùng với Frontend; thiếu secret thì bỏ qua (chỉ
  còn SSE). Lỗi revalidate chỉ ghi log, webhook vẫn trả 200. Đã kiểm
  chứng bằng stub: đủ 3 tag (articles, case-studies, widgets).
- **BE 15 — đăng ký sự kiện**: `POST /api/events/{slug}/register`
  (201; trùng email+sự kiện trong 24h → `duplicate: true`; thiếu consent
  → 400). Email xác nhận kèm file .ics (từ startDate/endDate FE gửi kèm),
  đẩy CRM qua hàng đợi `crm_outbox` (worker 30s, cùng luật retry với
  `crm_jobs`). Bảng `event_registrations`.
- **BE 16 — nộp CV**: `POST /api/jobs/{slug}/apply` (multipart: PDF/DOCX
  ≤ 5 MB, kiểm tra magic bytes; sai loại/quá 5 MB/thiếu consent → 400).
  File lưu ở `UPLOADS_DIR/cv/` (tên UUID), quét virus **giả lập** (ghi
  log, chưa có ClamAV), đẩy HR qua `crm_outbox`. Cần
  `python-multipart` (đã thêm vào `requirements.txt`). Bảng
  `job_applications`.
- **BE 17 — newsletter double opt-in**: `POST /api/newsletter` lưu
  pending + gửi link xác nhận (token chỉ lưu dạng hash, hết hạn 7 ngày);
  `GET /api/newsletter/confirm?token=...` xác nhận (dùng 1 lần; sai/hết
  hạn → 400). Đã xác nhận rồi thì đăng ký lại không gửi lại link. Link
  trỏ về `{FRONTEND_URL}/{locale}/newsletter/confirm?token=...` (trang
  FE ở R1-5).
- **BE 18-20 — tìm kiếm** (`GET /api/search`, không Meilisearch): đọc
  nội dung công khai từ Strapi (`STRAPI_URL`, cache 5 phút), khớp không
  dấu (cả "wifi" khớp "Wi-Fi"), lọc `locale` (vi/en/all — mặc định
  locale đang xem, SRCH-03) + `market` + `type`, đếm facet theo loại.
  Trả `source: strapi|fallback`; khi Strapi không tới được thì dùng chỉ
  mục dự phòng (6 sản phẩm + 26 solution, dữ liệu tĩnh trong code).
  Đã kiểm chứng live: `heatmap` en 4 bài, `bản đồ nhiệt` vi 4 bài,
  `wifi` vi 37 / all 74, fallback `retail` 2 kết quả.
- **BE 9/10/21-24 — hạ tầng:** media R1 dùng upload local Strapi +
  `next/image` AVIF/WebP (`remotePatterns` theo host Strapi trong
  `next.config.ts` — tsc sạch); object storage/CDN, IP/VPN, role
  Editor/Author, CI/CD, Sentry, backup định kỳ là bước triển khai — đã
  ghi rõ cách làm trong `cms/README.md` (BE 9-10) và README của
  BE_inventory (BE 21-24), không dựng hạ tầng thật trong R1.

### 6.15. R1-3: Home mới + Products/Solutions/AdFormats (FE 22-32, 23/11/2026)

- **Trang Home mới** (`src/app/[locale]/page.tsx`, server): hero từ Home
  single + tab 6 sản phẩm (màu/CTA đổi theo tab), 6 thẻ sản phẩm, bước
  HowItWorks từ CMS, dải snapshot từ DataSnapshot single (6 chỉ số, ngày
  cập nhật — không dùng SSE realtime nữa), showcase mới nhất (2 News + 2
  Resource + 2 Event), CTA cuối trang mở dialog lead theo source, form
  lead nhúng ở cuối. Hero prompt + heatmap + StatsStrip cũ không còn ở
  Home (heatmap/số realtime ở /locations, prompt ở /advertisers); 4
  component cũ vẫn nằm trong cây để R2 dùng lại cho trang Data.
- **Trang /products** (FE 28): thẻ infographic (số thứ tự, nhãn mục tiêu,
  tên, slogan, mô tả, tối đa 4 solution, ảnh cover khi có, link chi
  tiết), `data-product` trên mỗi thẻ.
- **Trang /products/{product}** (FE 29): hero riêng + Opportunity +
  Solutions + How to plan + Showcase + Lead form — tất cả từ dynamic-zone
  blocks của Strapi (trừ block hero: trang tự render hero để khỏi lặp
  tiêu đề). Breadcrumb + BreadcrumbList schema.
- **Trang /products/{product}/{solution}** (FE 30): nội dung từ blocks
  của solution, solution cùng sản phẩm, case study mới nhất, Breadcrumb +
  schema. URL khớp với `/api/search` của BE.
- **Trang /ad-formats** (FE 31): lọc theo loại (video/banner/chữ — trường
  `formatType` mới thêm vào schema AdFormat + seed), xem trước trên khung
  điện thoại, bảng thông số; iframe sandboxed + lazy chỉ render khi format
  có previewUrl (dữ liệu R1 chưa có).
- **Tầng dữ liệu** (`src/lib/strapi.ts`): fetchers products/solutions/
  ad-formats/resources/events/articles/home/snapshot + `mapStrapiBlocks`
  (DZ → Block) + `strapiSingle`/`strapiBySlug`; `pageSize` đặt rõ (mặc
  định Strapi chỉ trả 25 — 118 bài News cần 200). Ảnh CMS qua `CmsImage`
  (next/image, alt bắt buộc, lazy, AVIF/WebP). Dialog lead mở từ mọi
  client component qua `LeadContext` (`useOpenLead`, source ghi rõ CTA).
- **2 lỗi thật bắt được khi verify:**
  1. Theme sản phẩm đặt trong `ProductCard` (client component) nên trang
     server chỉ thấy client reference stub (undefined) → /products và
     trang chi tiết crash "Cannot read properties of undefined (reading
     'bar')". Sửa: chuyển `PRODUCT_THEME` + `PRODUCT_COLOR_LABEL` +
     `ProductColor` sang module thuần `src/lib/product-theme.ts`.
  2. Strapi chỉ trả component trong dynamic zone khi `populate=blocks`,
     còn repeatable lồng trong đó (items/steps) thì KHÔNG — phải thêm
     `populate[blocks][populate]=*`. Và Strapi cấm trộn 2 dạng populate
     trong 1 request (chuỗi "a,b" + object → 400; trộn `populate[x]=*`
     với `populate[y][populate]=*` cũng 400) nên `appendPopulate` dùng
     thống nhất dạng `populate[x][populate]=*` khi có deep populate.
- **Next 16 + cacheComponents:** `export const dynamic = "force-dynamic"`
  bị cấm → trang CMS dùng `await connection()` + `export const instant =
  false` (route chặn, đọc Strapi ở mỗi request). Hai route động cùng vị
  trí phải cùng tên param: `/products/[slug]` đổi thành
  `/products/[product]` (trùng với route solution).
- **Verify 23/11 (Playwright, 33/33):** home (hero + tab Measurement đổi
  nội dung, 6 thẻ, snapshot 25.400.000, showcase, CTA mở dialog), danh
  sách 6 sản phẩm + số thứ tự + data-product, chi tiết Measurement (đủ 5
  khối + lead form + BreadcrumbList), solution Footfall Attribution
  (siblings + case study), ad-formats (lọc Video/Chữ, bảng thông số,
  phone preview), EN + 404. Lint 0 lỗi, tsc sạch, build pass.

### 6.16. R1-4: Resources, Events, News, Company, Jobs, FAQ (FE 33-44, 23/11/2026)

- **Thay đổi schema Strapi (nhỏ, có backfill):** Case Study thêm `slug`
  (uid từ title) để có trang /case-studies/[slug] + link từ Customers;
  Resource thêm `industry` (string) để lọc theo ngành ở /resources. Seed
  đã cập nhật cả 2 trường; DB đã seed trước đó được backfill bằng
  `cms/scripts/backfill-r14.js` (3 slug + 12 industry, chạy 1 lần trên
  cms/.tmp/seed.db, đã verify qua REST).
- **Trang mới:** /resources (lọc loại/ngành/năm qua URL, phân trang 6) +
  /resources/[slug] (T.Article + schema Article); /events (tab Sắp diễn
  ra/Đã diễn ra theo ngày bắt đầu, lọc hình thức) + /events/[slug]
  (chương trình, diễn giả, form đăng ký BE 15 khi chưa diễn ra, nút tải
  .ics, schema Event); /news (118 bài, lọc chuyên mục, phân trang 12) +
  /news/[slug] (T.Article + NewsArticle + tin liên quan); /case-studies/
  [slug] (T.Article); /about (định vị + số liệu + văn phòng thật —
  timeline/team chưa có dữ liệu CMS nên chỉ ghi chú chờ cập nhật, không
  bịa tên người/cột mốc); /partners (3 nhóm, CHỈ consent=true — đối tác
  consent=false không hiện); /customers (tên + testimonial + link case
  study); /investors (định vị + số liệu công khai + liên hệ); /privacy,
  /terms, /cookies (T.Page, bản tóm tắt R1 — văn bản pháp lý đầy đủ do
  AWING ban hành sau); /careers (lọc phòng ban/địa điểm, ẩn vị trí hết
  hạn) + /careers/[slug] (mô tả + yêu cầu + form nộp CV BE 16 + schema
  JobPosting); /faq (accordion theo nhóm + schema FAQPage);
  /newsletter/confirm (đích của link xác nhận BE 17 — trang server gọi
  thẳng BE bằng token trong URL, token không lộ ra client).
- **Component dùng chung mới:** ArticleTemplate (header + mục lục tự động
  từ tiêu đề "## " + nội dung + khối liên quan + JSON-LD), RichText
  (đoạn văn + tiêu đề), ShareButtons (sao chép link + X/LinkedIn/
  Facebook), FaqAccordion, EventRegistrationForm, CvApplicationForm
  (kiểm tra file PDF/DOCX ≤ 5 MB ngay trên trình duyệt, cả đuôi lẫn
  magic bytes), ServerPagination (link giữ bộ lọc).
- **Footer:** đã bật link tới /products/*, /resources (theo loại),
  /events, /news, /about, /partners, /customers, /investors, /careers,
  /faq, /privacy, /terms, /cookies — chỉ còn Data (R2) và mạng xã hội
  (SOC-01) vẫn mờ.
- **3 lỗi thật bắt được khi verify:**
  1. `fetchEvents`/`fetchArticles` map trường `summary` không tồn tại
     (Event có `description`, Article có `content`) nên thẻ showcase ở
     Home và danh sách đều trống mô tả — đã sửa: tóm tắt = đoạn đầu
     của richtext (`richTextExcerpt`).
  2. Strapi giới hạn `pageSize` tối đa 100 — `pageSize=200` chỉ trả 100
     trong 118 bài News (trang 10 biến mất). Đã sửa: `fetchArticles`
     đọc nối 2 trang (100 + 18); `strapiList` thêm tham số `page`.
  3. Trang /newsletter/confirm đọc `searchParams` nên build lỗi
     prerender — đã thêm `await connection()` + `export const instant
     = false` như các trang CMS khác.
- **Verify 23/11 (Playwright, 53/53):** resources (lọc loại/ngành/năm,
  phân trang, chi tiết + Article JSON-LD), events (tab upcoming/past,
  lọc online, chi tiết + agenda/speakers, đăng ký thật → thành công +
  nút .ics, sự kiện cũ không form), news (12/trang, 10 trang, lọc
  chuyên mục, chi tiết + NewsArticle JSON-LD), case study, about
  (số liệu + VCCI), partners (ẩn consent=false), customers, investors,
  3 trang pháp lý, careers (lọc Sales/Hà Nội, chi tiết + JobPosting,
  nộp CV PDF thật → thành công, CV .txt bị từ chối), FAQ (accordion +
  FAQPage JSON-LD), newsletter confirm (không token / token đúng / dùng
  lại token), footer link đã bật, link showcase ở Home mở được, EN.
  Lint 0 lỗi, tsc sạch, build pass.
- **Chưa làm được trong R1-4:** bộ lọc Resources theo sản phẩm (schema
  Resource không có relation product — cần thêm ở CMS); trang About
  chưa có timeline/team thật (chờ nội dung CMS); mục lục T.Article chỉ
  hiện khi biên tập viên viết tiêu đề "## " (nội dung seed R1 toàn đoạn
  văn); sự kiện cũ chưa có recap slides/video (seed không có).

### 6.17. R1-5: Search + Social/OG + Contact + E2E + Responsive + Web Vitals (FE 45-54, 23/11/2026)

- **FE 45-47 — tìm kiếm:** `SearchOverlay` gọi `GET /api/search` của
  FastAPI (BE 18-20) thay cho danh mục tĩnh: debounce 200 ms, chống
  phản hồi cũ đè mới (số thứ tự request), điều hướng bằng phím mũi tên
  + Enter, Esc đóng, Ctrl+K hoặc `/` mở (SiteChrome), link "Xem tất
  cả" sang /search. BE không tới được → dùng lại danh mục tĩnh 6 sản
  phẩm + 26 solution + trang (cùng cách khớp không dấu). Phạm vi ngôn
  ngữ: mặc định locale hiện tại, có lựa chọn "Tất cả ngôn ngữ". Trang
  **/search** (server, `connection()` + `instant = false`): query +
  tab + locale trong URL, tab Tất cả/Sản phẩm (products+solutions)/
  Tài nguyên/Sự kiện/Tin tức/Tuyển dụng với số đếm từ facet của BE,
  phân trang 12, trạng thái rỗng. Tab "Data" chưa có — BE chưa index
  nội dung dữ liệu (mạng lưới/bản đồ nhiệt), không hiện tab luôn bằng
  0; thêm khi R2 có index dữ liệu. JSON-LD WebSite thêm `SearchAction`
  trỏ `/vi/search?q={search_term_string}` (giờ /search đã có thật).
  `src/lib/api.ts` thêm `searchContent()` + kiểu `SearchResultItem`/
  `SearchResponse`.
- **FE 48 — mạng xã hội:** link Facebook/LinkedIn/YouTube/Zalo OA/
  TikTok ở footer + trang Contact lấy từ single Global trong Strapi
  (`fetchGlobal`, tag `strapi:global` — sửa URL trong CMS là đổi luôn
  cả 2 nơi). URL hiện tại là giá trị seed R1 (facebook.com/
  awingvietnam…) — **SOC-01 chưa chốt URL thật**, cần tran xác nhận/
  sửa trong Strapi trước go-live. `sameAs` trong JSON-LD vẫn CHƯA gắn
  (chỉ gắn khi SOC-01 chốt URL thật, không đoán URL).
- **FE 49 — OG image:** `src/app/[locale]/opengraph-image.tsx`
  (ImageResponse, 1200×630, nền đỏ + tagline theo locale) + `images`
  tường minh trong `pageMetadata()` (URL theo locale) + `metadataBase:
  new URL(SITE_URL)` (không có thì Next dùng http://localhost:3000 cho
  ảnh OG). ShareButtons đã có từ R1-4 (sao chép link + X/LinkedIn/
  Facebook). Trang chi tiết có cover thật sẽ ghi đè `openGraph.images`
  riêng khi CMS có ảnh.
- **FE 50 — Contact:** trang thành server component: form liên hệ cũ
  tách ra `ContactForm.tsx` (không đổi hành vi), thêm bản đồ trụ sở Hà
  Nội (Google Maps embed, không cần API key + link "Mở trên Google
  Maps"), link mạng xã hội từ Global, và form lead nhúng (`LeadForm`
  mode embedded, source="contact").
- **FE 51 — E2E trong repo:** `e2e/` (Playwright, `@playwright/test`
  1.49.1 — phải khớp đúng bản này vì VM chỉ có chromium-1148; bản
  1.65.1 đòi chromium_headless_shell-1255 không có sẵn): `lead-otp`
  (Get data → form → mã sai còn 4 lần → mã đúng đọc từ log email giả
  lập của BE → bổ sung hồ sơ → đóng), `redirects` (2 redirect 308),
  `search` (gợi ý + phím + Esc + tab /search). Chạy:
  `E2E_BASE_URL=http://127.0.0.1:3100 BE_LOG_PATH=/tmp/be-*.log npx
  playwright test --config e2e/playwright.config.ts` (xem
  `e2e/README.md`). Script verify R1-2 cũ (`/tmp/pw-i18n/verify-r12.js`)
  đã mất khi /tmp bị dọn — bộ E2E trong repo thay thế nó.
- **FE 52 — responsive + a11y:** kiểm tra 360/768/1024/1440 (home,
  news) + Tab tới được nút tìm kiếm. Sửa 2 lỗi tràn ở 360px: tab sản
  phẩm ở HomeHero (ui/Tabs cuộn ngang + `whitespace-nowrap`) và phân
  trang (ServerPagination + ui/Pagination cho phép xuống dòng).
- **FE 53 — Web Vitals:** đo local bằng PerformanceObserver (gắn trước
  khi tải trang, context mới để transferSize là byte mạng thật): home
  LCP 557ms / CLS 0 / JS 194KB, product LCP 259ms / CLS 0 — đều đạt
  (LCP < 2.5s, CLS < 0.1, JS < 200KB). Lưu ý: JS tính theo **transfer**
  (byte mạng, 194KB); dung lượng giải mã là 626KB. Không chạy
  Lighthouse trên VM này (chưa cài) — số trên là đo local, không phải
  Lighthouse.
- **FE 54 — UAT + go-live:** của tran (chưa làm).
- **4 lỗi thật bắt được khi verify R1-5:**
  1. CSP `frame-src 'none'` chặn iframe Google Maps ở /contact — đã
     sửa: `frame-src https://www.google.com` (chỉ đúng origin này)
     trong `next.config.ts`.
  2. Layout đọc Global (fetch `strapi:global` không cache) làm build
     lỗi prerender ở trang tĩnh /advertisers — đã sửa: `strapiSingle`
     thêm tham số `cache`, `fetchGlobal` dùng `cache: "force-cache"`
     (revalidate bằng tag khi Strapi publish, BE 8). Trang động vẫn
     đọc mới mỗi request như cũ.
  3. Ảnh OG: file `opengraph-image.tsx` đặt ở gốc (`src/app/`) thì
     Next KHÔNG gắn vào các trang [locale] (HTML không có og:image);
     đặt trong `[locale]/` mới có. Thêm nữa, trang nào tự định nghĩa
     `generateMetadata` (vd /search, /contact) thì Next cũng không
     gắn ảnh file-based — chỉ trang không có generateMetadata riêng
     (vd home) mới tự nhận. Đã sửa: đặt file trong `[locale]/` +
     `images` tường minh trong `pageMetadata()` + `metadataBase`.
     Middleware cũng đã loại trừ `opengraph-image`/`twitter-image`
     khỏi chuyển hướng locale (không thì URL ảnh bị 307 về
     /vi/opengraph-image → 404).
  4. `runtime = "edge"` trên opengraph-image.tsx bị cacheComponents
     cấm — đã bỏ (ImageResponse chạy được ở Node runtime).
- **Verify 23/11 (Playwright, 34/34 + E2E 6/6 + hồi quy R1-3 33/33 +
  R1-4 53/53):** overlay (Ctrl+K, gợi ý API, ArrowDown+Enter tới đúng
  gợi ý, Esc, scope=all), /search (tab + số đếm, tab news đổi URL,
  trạng thái rỗng, locale=all), social footer/contact, SearchAction
  JSON-LD, OG (PNG 200, og:image ở home/search/contact), contact
  (form/bản đồ/lead nhúng/socials/VCCI), responsive 360-1440 không
  tràn, Tab tới nút tìm kiếm, Web Vitals đạt, không console/pageerror
  mới. Lint 0 lỗi, tsc sạch, build pass. **R1 hoàn tất** (FE 1-54 trừ
  FE 54 UAT của tran + BE 1-26) — **đã push nhánh `r1-2` (FE 8089b8f1,
  BE b2312575) và tran đã merge vào main (FE e046e64, BE 0867f77) ngày
  24/11/2026.**

### 6.18. Đóng gói + review + kiến trúc BFF (24/11/2026)

Sau khi merge, tran yêu cầu đóng gói phần hiện tại: review 1 lượt tính năng
chính, tìm bug, tối ưu code, hoàn thiện kiến trúc, cập nhật lại Plan.

- **Kiến trúc BFF (theo yêu cầu của tran):** trình duyệt chỉ nói chuyện với
  Next.js; Next.js gọi các dịch vụ phía sau. Xem sơ đồ mục 2. Proxy
  `src/app/api/backend/[...path]/route.ts` (streaming, SSE chạy qua được,
  `redirect: "manual"` để OAuth 307 tới trình duyệt, forward cookie +
  set-cookie cho OAuth state). `BACKEND_URL` thay
  `NEXT_PUBLIC_API_BASE_URL` (xóa khỏi `.env.example`, compose, `api.ts`).
  CSP `connect-src 'self'`; ảnh CMS qua `next/image`; OAuth redirect URI
  mới `{FRONTEND_ORIGIN}/api/backend/auth/google/callback` — **phải đăng ký
  lại trên Google Cloud Console trước khi đăng nhập Google thật chạy lại**.
- **Review BE + CMS (1 blocker, 6 major, 16 minor) — đã sửa + verify live:**
  - **B1 (blocker):** `POST /api/leads/{id}/verify` cấp token cho lead đã
    xác thực mà không cần OTP → bỏ nhánh này, verify luôn kiểm tra OTP;
    resend là cách duy nhất lấy token mới (cooldown 60s + 5 mã/ngày vẫn giữ);
    CRM chỉ queue đúng 1 lần ở lần xác thực đầu.
  - **M1:** URL fallback của 26 solution hỏng (`/products//<slug>`) → sửa
    generator, verify 32 item, 0 URL hỏng.
  - **M2:** CV đọc hết file vào RAM trước khi kiểm tra size → pre-check
    `Content-Length`, đọc theo chunk 64KB có giới hạn; file lỗi insert được
    xóa (không còn file mồ côi); `file_path` lưu tương đối `cv/<uuid>.ext`.
  - **M3:** OAuth `state` không kiểm tra + JWT trả qua URL → `state` lưu
    cookie HttpOnly SameSite=Lax, callback đối chiếu (sai → 400
    `OAUTH_STATE_MISMATCH`); kiểm tra `email_verified`; bỏ xin refresh token
    không dùng. JWT vẫn trả qua `?auth_token=` (FE đọc rồi dọn khỏi URL ngay).
  - **M4:** `JWT_SECRET` mặc định hardcode → **fail-closed: thiếu là backend
    không khởi động**; trùng giá trị mẫu trong `.env.example` thì log cảnh báo
    lớn. Webhook không secret thì log cảnh báo lúc boot.
  - **M5/M6:** rate limit chỉ có ở `/api/leads` → thêm cho contact,
    newsletter, event register, CV apply (theo email, 5/phút; CV 3/phút),
    suggest (theo IP, 30/phút); module mới `app/rate_limit.py` — đọc
    `X-Forwarded-For`, tự dọn bucket hết hạn. Lưu ý sau BFF mọi request tới
    BE đều mang IP của proxy Next.js nên giới hạn theo IP trở thành giới hạn
    toàn site — endpoint nào có email thì giới hạn theo email.
  - **Minor đã sửa:** OTP so hash bằng `hmac.compare_digest`; ICS escape
    RFC 5545 + tz lỗi trả None thay vì 500; `queue_lead_sync` lỗi không biến
    verify thành công thành 500; index DB `leads(email)`, `lead_otps(lead_id)`,
    `event_registrations(event_slug, email)`; `@app.on_event` → `lifespan`;
    `requirements.txt` pin version (fastapi 0.163.2, uvicorn 0.54.0, pydantic
    2.14.3, PyJWT 2.15.1, python-multipart 0.0.34); newsletter confirm với
    `created_at` sai định dạng → 400 `TOKEN_EXPIRED` (fail-closed); Strapi
    bootstrap thu hồi quyền public thừa + webhook cập nhật theo tên
    `awing-backend` (không còn webhook mồ côi khi đổi URL); seed event có
    agenda/speakers tiếng Anh riêng, sửa comment khoảng ngày bài viết,
    cảnh báo seed dở dang (vi có, en thiếu), single draft-only không làm
    `--force` lỗi; backfill phân trang qua 100.
  - **Chưa sửa (ghi nhận):** N2 race dedupe/OTP (cần UNIQUE index +
    transaction), N8 search index build lần đầu có thể chậm ~120s (không
    deadline tổng), N9 SSE queue không giới hạn + CRM worker sync chặn event
    loop (thiết kế single-worker), N5 validate schema lỏng (email pattern…),
    N7 dead code còn lại (stats.py, email.py), N16 field schema chưa dùng
    (`product.link`, `resource.file` — R2 cần `resource.file`).
- **Review FE (2 blocker + 10 major + ~30 minor) — đã sửa + verify:**
  - **B1:** `/locations` hiện "63/32" tỉnh (sai dữ liệu) → `/63`.
  - **B2:** `/advertisers` + `/locations` mang canonical/title của trang chủ
    → layout riêng từng segment với `pageMetadata()` đúng; `/components`
    (docs nội bộ) + `/newsletter/confirm` thêm `robots: noindex`.
  - **M1:** header 11 mục menu chết → nối link tới trang R1 thật (Reports/
    Papers/Case Studies → `/resources?type=…`, Events → `/events`, News →
    `/news`, Company → `/about`…`/careers`); tên sản phẩm/solution trong mega
    menu + drawer thành link; 3 mục Data chưa có trang ở R1 gỡ khỏi menu
    (thuộc R2) — cả header lẫn footer.
  - **M2:** mega menu tự đóng khi bấm vào trong → `navRef` chuyển lên
    `<header>` (bao cả mega menu).
  - **M3+M4:** Modal/Drawer không cuộn được + không focus trap → hook dùng
    chung `useFocusTrap` (Tab quay vòng, Escape, trả focus về nút mở),
    dialog/panel `max-h + overflow-y-auto`; 2 modal cũ (AdvertiserAuthModal,
    FormatPreviewModal) chuyển sang `ui/Modal` (có Escape + focus trap).
  - **M5:** dropdown điều hướng bằng phím mũi tên (ArrowDown/Up/Home/End);
    `aria-haspopup="menu"` ở Header + AuthSession.
  - **M6:** JSON-LD JobPosting `datePosted` lấy bằng deadline → bỏ trường
    này (chưa có ngày đăng thật); type lạ hiện đúng giá trị gốc.
  - **M7:** sitemap chỉ có 4 route → sinh động từ Strapi (products +
    solutions, resources, events, news, careers, case studies) + 17 route
    tĩnh; `lastModified` từ ngày thật.
  - **M9+M10:** nhãn "Email *" dùng key `form.email` theo locale; khối case
    study ở trang solution thành link tới `/case-studies/[slug]`.
  - **Minor đã sửa:** SearchOverlay `aria-controls` chỉ gắn khi có danh
    sách; Tabs có id/`aria-controls` + tabpanel (HomeHero, /components);
    Pagination/ServerPagination nhận `ariaLabel` theo locale; "—%" ở
    AdFormatCatalog; `nav.trusted` en "Trusted by"; BlockRenderer bỏ khung
    "chưa hỗ trợ" (trả null như `mapStrapiBlocks`); `todayIso()` theo giờ VN;
    sự kiện đang diễn ra vẫn "sắp tới" (so endDate), `eventStatus` chỉ gắn
    khi sắp tới; `/resources` sort mới nhất phía Strapi; home chỉ fetch 3 bài
    mới nhất mỗi loại (trước 200/100/100); ContactInfo thành link `tel:`;
    Button disabled + href chặn click (aria-disabled); Footer bỏ chip
    awing.global R4 + năm bản quyền động; RichText giữ thứ bậc h1/h2/h3 +
    id trùng tên phân biệt; `decodePayload` bù padding base64url;
    TurnstileWidget `remove()` khi unmount; trang /search báo lỗi khi tab
    lỗi; trục Y biểu đồ thành phố động; `ProductColor` chỉ định nghĩa một
    nơi (product-theme); ContentCard một link duy nhất; Link "Tìm hiểu ngay"
    ra khỏi vùng button ở AdFormatCard; h1 /locations vào trong `<main>`;
    file .ics phía trình duyệt thêm DTSTAMP + escape RFC 5545; lỗi
    tên/công ty trống có thông báo riêng; ngày cập nhật snapshot định dạng
    theo locale; StatsCard/ContentCard bỏ `"use client"` thừa; thêm E2E
    `header-links.spec.ts` (không còn mục chết, link điều hướng đúng, phím
    mũi tên trong dropdown).
  - **Không sửa (ghi nhận + lý do):** xóa 4 component Home cũ mồ côi
    (Hero/CampaignPromptForm/StatsStrip/LocationIntelligence) — cần tran
    đồng ý; `aria-current` trên chip lọc giữ nguyên (link điều hướng trong
    tập hợp, `aria-pressed` chỉ dành cho nút toggle); tooltip heatmap cho
    bàn phím, `sizes` ảnh hero, `<html lang>` động — để đợt sau.
- **Verify sau đóng gói (24/11):** tsc sạch, lint 0 lỗi / 3 warning cũ,
  build pass, E2E 6/6, smoke 19 route 200, lead → OTP → verify → PATCH qua
  proxy OK, rate limit (lead 5/phút/email, suggest 30/phút/IP) trả 429 đúng,
  CV 6MB từ chối, OAuth state qua proxy (Set-Cookie HttpOnly, sai state →
  400), bundle client không còn địa chỉ backend.

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
| Nút đăng nhập Google báo lỗi | Backend chưa cấu hình Google OAuth, hoặc redirect URI chưa đăng ký | Kiểm tra `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` trong `.env` của repo `BE_inventory` và redirect URI `{FRONTEND_ORIGIN}/api/backend/auth/google/callback` đã đăng ký trên Google Cloud Console chưa. |
| Frontend gọi Strapi trả 403 | Bootstrap chưa cấp quyền Public | Xem log Strapi (`docker compose logs strapi`): phải có dòng `[bootstrap] Đã cấp quyền public`. Nếu không có, kiểm tra lỗi bootstrap trong log; kiểm tra lại trong admin: Settings → Users & Permissions → Roles → Public phải có `find`/`findOne` cho các content type (13 loại từ R1-1). |
| Frontend gọi Strapi trả 404 | Sai tên content type / chưa Publish bài / Single Type Home chưa có bản ghi | Kiểm tra slug trong Content-Type Builder; bài phải ở trạng thái Published. Riêng `/api/home` trả 404 khi chưa tạo bản Home nào là đúng (Strapi trả 404 cho Single Type rỗng). |
| Publish trên Strapi mà Frontend không đổi | Webhook chưa tới FastAPI, hoặc Frontend chưa fetch lại | Kiểm tra webhook đã tạo chưa (log Strapi phải có `[bootstrap] Đã tạo webhook tới backend`) và URL webhook đúng chưa (mục 6.2); kiểm tra log FastAPI có nhận webhook không; thử reload trang để kiểm tra nội dung đã Publish chưa. |
| `docker compose up` báo thiếu biến | Chưa copy `.env.example` sang `.env`, hoặc thiếu secret | `cp .env.example .env` rồi điền đủ các secret (Compose báo rõ tên biến thiếu). |
| `docker compose up` lỗi kết nối Postgres | Password không khớp giữa hai service, hoặc Postgres chưa sẵn sàng | Kiểm tra `POSTGRES_PASSWORD` trong `.env` khớp `DATABASE_PASSWORD` của service strapi; Compose đã có healthcheck + `depends_on`, chờ Postgres healthy rồi Strapi mới lên. |
| Đổi `.env` rồi mà Frontend trong Compose vẫn hiện số liệu cũ | `NEXT_PUBLIC_*` nhúng vào bundle lúc build | Build lại image Frontend: `docker compose up --build -d`. |
| Lỗi Node version khi chạy Strapi | Node không phải LTS | Dùng Node 22 hoặc 24 LTS (`node -v` kiểm tra). |
| Cổng 3000/8000/1337 đã có tiến trình khác | Trùng cổng | Chạy host: Frontend `npm run dev -- -p 3001`; FastAPI `--port 8001` và sửa `.env.local` theo. Chạy Compose: sửa cổng map trong `docker-compose.yml` (ví dụ `"3001:3000"`). |

## 9. Ghi chú deploy (tóm tắt)

- Frontend: deploy Vercel hoặc bất kỳ host Node nào; set 2 biến
  `BACKEND_URL` (server-only, trỏ về FastAPI) và `NEXT_PUBLIC_STRAPI_URL`
  trỏ về domain thật. `NEXT_PUBLIC_STRAPI_URL` nhúng vào bundle lúc build
  nên đổi giá trị là phải build lại (deploy lại, hoặc
  `docker compose up --build` khi chạy Compose); `BACKEND_URL` đổi được
  không cần build lại.
- FastAPI: chạy trên VPS/host có Python, dùng systemd hoặc PM2 giữ tiến
  trình; đặt sau reverse proxy (Nginx/Caddy) nếu cần HTTPS. **Bắt buộc
  `JWT_SECRET` trong `.env` — thiếu là backend không khởi động.** Chạy
  sau reverse proxy thì bật `--proxy-headers` (rate limit lấy IP thật
  từ `X-Forwarded-For`).
- Strapi + Postgres: chạy bằng Compose trên cùng VPS (hoặc tách máy);
  backup định kỳ 2 volume `postgres-data` và `strapi-uploads`.
