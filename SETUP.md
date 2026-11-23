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
tự tạo bảng rỗng khi khởi động. Thao tác trực tiếp file này trên host để
thêm/xoá/sửa dữ liệu thử nghiệm.

### 5.3. Hợp đồng API Frontend đang gọi

Base URL: `NEXT_PUBLIC_API_BASE_URL`. Tất cả trả JSON. CORS phải mở cho
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
  Lượt kết nối +100.000/kỳ mặc định (`GROWTH_CONNECTIONS_PER_CYCLE`), reach /
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
   `{PUBLIC_BASE_URL}/api/auth/google/callback` (local:
   `http://localhost:8000/api/auth/google/callback`). Lấy Client ID và
   Client Secret.
2. **Đặt vào `.env` của backend** (`BE_inventory/.env`):
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` (giá trị ngẫu
   nhiên, dài) và `PUBLIC_BASE_URL` phải khớp đúng redirect URI đã đăng ký
   với Google — sai một ký tự Google cũng từ chối callback.

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
- **Chưa xong:** BE 7 (migrate 118 news + 12 FAQ, chờ bản xuất dữ liệu);
  BE 8 phía FastAPI (webhook → revalidate); CRM/email/Turnstile thật (chờ
  quyết định #1, #4); trang /products, /resources, /events, /news, /about,
  /careers (R1-3/R1-4) — link trong menu/footer hiện mờ tới lúc đó.

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
| Nút đăng nhập Google bị mờ | `NEXT_PUBLIC_API_BASE_URL` chưa cấu hình, hoặc backend chưa cấu hình Google OAuth | Cấu hình `.env.local`, kiểm tra `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` trong `.env` của repo `BE_inventory`. |
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
  `NEXT_PUBLIC_API_BASE_URL` và `NEXT_PUBLIC_STRAPI_URL` trỏ về domain thật.
  Hai biến này nhúng vào bundle lúc build nên đổi giá trị là phải build lại
  (deploy lại, hoặc `docker compose up --build` khi chạy Compose).
- FastAPI: chạy trên VPS/host có Python, dùng systemd hoặc PM2 giữ tiến
  trình; đặt sau reverse proxy (Nginx/Caddy) nếu cần HTTPS.
- Strapi + Postgres: chạy bằng Compose trên cùng VPS (hoặc tách máy);
  backup định kỳ 2 volume `postgres-data` và `strapi-uploads`.
