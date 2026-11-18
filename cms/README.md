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

## Content types (đã khai sẵn trong `src/api/`)

| Loại | Kiểu | Ghi chú |
|---|---|---|
| Article | Collection Type | Blog: title, slug, cover, content, category, SEO. |
| Case Study | Collection Type | title, industry, metricLabel, metricValue, cover, summary, SEO. Frontend hiện ở `/advertisers`. |
| Product | Collection Type | name, slug, description, cover, link, SEO. |
| Home | Single Type | Nội dung trang chủ: heroTitle, heroSubtitle, statsNote, howItWorks, SEO. |

Component dùng chung (`src/components/shared/`): `seo` (metaTitle,
metaDescription, keywords, ogImage) và `how-it-works-step`.

Tất cả đều bật Draft/Publish: chỉ bản published mới tới Frontend.

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
content type (Article, Case Study, Product, Home) nên agent có thể đọc/ghi
nội dung CMS qua MCP.

Tạo token trong Strapi admin: Settings → Global settings → API Tokens →
Create new API Token — token chỉ hiện một lần lúc tạo, lưu kỹ. Chưa có
token thì mọi request tới `/mcp` đều trả 401 `Authentication required`.

## Đa ngôn ngữ (i18n) — EN + VI

i18n bật cho cả 4 content type (`pluginOptions.i18n.localized: true` trong
mỗi schema). Các trường chữ (title, slug, content, category, summary,
description, heroTitle, heroSubtitle, statsNote, howItWorks, SEO) có bản
riêng theo locale; ảnh (cover, ogImage), số (metricValue) và link (Product)
dùng chung cho mọi locale.

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
