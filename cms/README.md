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

## Biến môi trường

Xem `.env.example`. Database mặc định là Postgres (qua Compose); để thử
nhanh trên host có thể dùng SQLite:

```bash
DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/data.db npm run develop
```
