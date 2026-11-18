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
| Frontend gọi Strapi trả 403 | Bootstrap chưa cấp quyền Public | Xem log Strapi (`docker compose logs strapi`): phải có dòng `[bootstrap] Đã cấp quyền public`. Nếu không có, kiểm tra lỗi bootstrap trong log; kiểm tra lại trong admin: Settings → Users & Permissions → Roles → Public phải có `find`/`findOne` cho 4 content type. |
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
