# AWING CMS — Strapi 5 (TypeScript)

Kho nội dung + trang admin của dự án AWING (Plan §6). Frontend đọc nội dung
qua Strapi REST; editor đăng nhập Strapi admin bằng tài khoản riêng.

## Chạy

Chạy bằng Docker Compose ở repo root (xem `../docker-compose.yml`):

```bash
docker compose up --build -d
```

Hoặc chạy trực tiếp trên host (cần Postgres đang chạy, hoặc SQLite để thử nhanh):

```bash
npm install
cp .env.example .env   # sửa secret khi cần
npm run develop        # http://localhost:1337/admin
```

Lần đầu mở admin, tạo tài khoản admin đầu tiên trên giao diện.

## Content types (R1-1, BE 1-10 — 11 loại trong `src/api/`)

| Loại | Kiểu | Ghi chú |
|---|---|---|
| Article (= News) | Collection Type | Tin tức (NEWS-01): title, slug, cover, content, category, publishedDate, market, SEO. Loại Article có sẵn được giữ làm News — không tạo thêm loại News riêng. |
| Case Study | Collection Type | title, industry, metricLabel, metricValue, cover, summary, market, SEO. Frontend hiện ở `/advertisers`. |
| Product | Collection Type | 6 sản phẩm (D-03): name, slug, tagline, goal, description, color (enum 6 màu sản phẩm), order, cover, link, solutions (relation), blocks (dynamic zone), market, SEO. |
| Solution | Collection Type | 26 solution (D-03): name, slug, product (relation), summary, blocks (dynamic zone), market, SEO. |
| Ad Format | Collection Type | Định dạng quảng cáo (PROD-04): name, slug, durationSeconds, metricLabel, metricValue, description, solution (relation), market, SEO. Đây là nội dung mô tả — khác `ad_formats` nghiệp vụ trong SQLite của FastAPI. |
| Resource | Collection Type | Tài nguyên (RES-01): title, slug, type (report/paper/case-study), summary, content, cover, file (PDF), publishedDate, market, SEO. |
| Event | Collection Type | Sự kiện (EVT-01/02): title, slug, description, startDate, endDate, mode (online/offline/hybrid), location, agenda, speakers, cover, market, SEO. |
| Job | Collection Type | Tuyển dụng (JOB-01/02): title, slug, department, location, type (full-time/part-time/contract/internship), description, requirements, deadline, market, SEO. |
| Partner | Collection Type | Đối tác (COMP-02): name, slug, logo, website, category, description, market. |
| Customer | Collection Type | Khách hàng (COMP-03): name, slug, logo, industry, testimonial, caseStudy (relation), market. |
| Data Snapshot | Single Type | Snapshot số liệu công khai (DATA-01, R1 tạm thay Data API): snapshotDate, metrics (JSON), note. R2 thay bằng ETL + Data API. |
| Global | Single Type | Cấu hình chung: siteName, contactEmail, defaultSeo, socialLinks. |
| Home | Single Type | Nội dung trang chủ: heroTitle, heroSubtitle, statsNote, howItWorks, SEO. |

Component dùng chung (`src/components/shared/`): `seo` (metaTitle,
metaDescription, keywords, ogImage), `how-it-works-step`,
`event-agenda-item` (time, title), `event-speaker` (name, role, company),
`social-link` (platform enum facebook/linkedin/youtube/zalo/tiktok, url).

Block components (`src/components/blocks/`, BE 6 — đúng danh sách 10 block
của FE 9 `BlockRenderer`): `block-hero`, `block-opportunity`,
`block-solutions`, `block-how-to-plan`, `block-showcase`, `block-lead-form`,
`block-rich-text`, `block-media`, `block-stats`, `block-cta` — mỗi block có
component con riêng cho các mục lặp (ví dụ `block-opportunity-item`).
Product và Solution có trường `blocks` (dynamic zone, localize theo locale).

Tất cả đều bật Draft/Publish: chỉ bản published mới tới Frontend.

Trường `market` (BE 5): enum `vn` / `global` / `id` / `th`, mặc định `vn`,
có trên mọi Collection Type (không localize — là bộ lọc, giống nhau mọi
locale). Single Type không có `market` (Global dùng chung; Data Snapshot
R1 chưa phân theo market).

Trạng thái BE 1-10 (23/11/2026, đã verify boot + endpoint trên DB SQLite
tạm): BE 1-6 xong. BE 7 (migrate 118 bài news + 12 FAQ) **chưa làm** — cần
bản xuất dữ liệu từ site cũ, chưa có. BE 8: webhook Strapi → FastAPI đã có
từ trước; phía FastAPI dịch webhook thành lời gọi revalidate sang Next.js
là việc của repo BE_inventory (chưa làm). BE 9 (media object storage + CDN)
và BE 10 (bảo mật admin IP/VPN + role Editor/Author) là việc hạ tầng, chưa
làm — cần quyết định khi triển khai.

## Quyền public và webhook — tự động qua bootstrap

`src/index.ts` chạy mỗi lần Strapi khởi động:

- Cấp quyền `find`/`findOne` cho role Public trên cả 4 content type (chỉ
  đọc, không ghi) — không cần bấm tay trong admin.
- Nếu có biến `STRAPI_WEBHOOK_URL` thì tạo webhook `awing-backend` (sự kiện
  `entry.publish`, `entry.unpublish`, `entry.update`) để Strapi báo cho
  backend FastAPI khi editor publish — backend đẩy sự kiện qua SSE để
  Frontend fetch lại nội dung.

## MCP server tích hợp sẵn (Strapi 5.47+, GA 5.49)

Đã bật trong `config/server.ts` (`mcp.enabled`, mặc định bật; đặt
`STRAPI_MCP_ENABLED=false` để tắt). Endpoint `POST /mcp`, xác thực bằng
admin API token (`Authorization: Bearer <token>`). Tool tự sinh theo từng
content type (cả 13 loại: Article, Case Study, Product, Solution, Ad Format,
Resource, Event, Job, Partner, Customer, Data Snapshot, Global, Home) nên agent có thể đọc/ghi
nội dung CMS qua MCP.

Tạo token trong Strapi admin: Settings → Global settings → API Tokens →
Create new API Token — token chỉ hiện một lần lúc tạo, lưu kỹ. Chưa có
token thì mọi request tới `/mcp` đều trả 401 `Authentication required`.

## Đa ngôn ngữ (i18n) — EN + VI

i18n bật cho cả 13 loại nội dung (`pluginOptions.i18n.localized: true` trong
mỗi schema). Các trường chữ (title, slug, content, category, summary,
description, heroTitle, heroSubtitle, statsNote, howItWorks, SEO, tagline,
goal, agenda, speakers, testimonial, blocks) có bản riêng theo locale; ảnh
(cover, ogImage), số (metricValue), link (Product) và trường `market` dùng
chung cho mọi locale.

Bootstrap trong `src/index.ts` tự tạo 2 locale `en` (English) và `vi` (Tiếng
Việt) rồi đặt **`vi` làm locale mặc định** — site tiếng Việt trước, tiếng Anh
là bản dịch. Không cần tạo locale tay.

Đọc theo locale qua REST:

```bash
curl "http://localhost:1337/api/articles?locale=vi"
curl "http://localhost:1337/api/articles?locale=en"
curl "http://localhost:1337/api/home?locale=vi"   # 404 khi Home chưa có nội dung
```

Không truyền `locale` thì trả locale mặc định (`vi`). Locale lạ cũng không
lỗi — Strapi trả về nội dung theo locale mặc định.

Tạo bản dịch trong admin: mở một entry, chọn locale ở góc trên bên phải
(`vi`/`en`), bấm tạo bản dịch rồi Publish từng locale riêng. Frontend hiện
chưa fetch theo locale — nút EN trên header chưa chuyển ngôn ngữ (bước sau).

## Biến môi trường

Xem `.env.example`. Database mặc định là Postgres (qua Compose); để thử
nhanh trên host có thể dùng SQLite — nhưng `better-sqlite3` không nằm trong
`package.json` (để image Docker không phải build native module), nên cài
tay trước khi chạy SQLite:

```bash
npm install --no-save better-sqlite3
DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/data.db npm run develop
```
