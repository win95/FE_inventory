# Báo cáo tổng kết R1 — AWING Website 2.0

- **Ngày:** 25/11/2026
- **Phạm vi:** FE 1–54 (trừ FE 54 UAT — của tran) + BE 1–26, theo file Excel
  `Docs/Break task - AWING Website 2.0.xlsx` và tài liệu
  `Docs/Docs_AWING_Website2.0.md`
- **Repo:** `win95/FE_inventory` (Next.js + Strapi) và `win95/BE_inventory`
  (FastAPI + SQLite)
- **Mốc:** xây xong 23/11/2026 → push nhánh `r1-2` sáng 24/11 (FE `8089b8f1`,
  BE `b2312575`) → tran merge vào main chiều 24/11 (FE `e046e64`, BE
  `0867f77`) → đóng gói + BFF tối 24/11 → push bản đóng gói sáng 25/11 (FE
  `06197bc5`, BE `16f31d87`; 4 component cũ đã xóa, head FE main `60e5216a`)

Tài liệu này trả lời 3 câu hỏi: **R1 đã làm gì, gặp vấn đề gì, đã giải quyết
bằng giải pháp và công nghệ nào.** Chi tiết kỹ thuật đầy đủ nằm ở `SETUP.md`
(§6.9–§6.18) và bản cập nhật kế hoạch R1
(`ke-hoach-r1-awing-website-2-0/ke-hoach-r1-cap-nhat-2026-11-24.md`).

## 1. Bối cảnh và quyết định nền tảng

- **Kiến trúc giữ nguyên** (tran, 23/11): Next.js + Strapi + FastAPI/SQLite.
  Không Meilisearch (search làm trên FastAPI), không BullMQ (hàng đợi CRM
  là FastAPI background task), Keycloak/Data API/ETL để R2.
- **Dữ liệu giả cho toàn bộ R1** (tran, 23/11 21:35): "làm hết R1 + API BE
  lấy dữ liệu giả lập trong sqlite" và "Strapi cũng tạo dữ liệu giả lập
  trong database". Mọi tích hợp thật (CRM, email, Turnstile) chỉ giả lập
  bằng log, tách riêng để thay provider thật sau này. Quyết định này ghi
  đè quy tắc "không mock data trong code" trước đó, trong phạm vi R1.
- **Quyết định thiết kế D-01..D-09** (tran, 23/11): logo đỏ là bản chính;
  nền trung tính, đỏ cho logo + CTA chính, mỗi sản phẩm một màu (quy tắc
  80/20); 6 Product / 26 Solution, ad format nằm trong Solution
  "Interactive Ad Experiences"; awing.vn cho VN (/vi + /en), awing.global
  cho thị trường mới, một codebase, hreflang chéo domain; 2 loại tài khoản;
  lead form bắt buộc email/SĐT/họ tên/công ty; dữ liệu công khai cập nhật
  hàng ngày, 3 tầng Khách/Lead/Tài khoản, không công khai doanh thu, tên
  khách kèm doanh thu, tọa độ thô; giữ Next.js + Strapi.
- **Kiến trúc BFF** (tran, 24/11 — đợt đóng gói): "Trình duyệt User truy cập
  chỉ nói chuyện với Next.js; Next.js gọi các dịch vụ phía sau." Xem §2.5.

## 2. Đã làm gì

### 2.1. R1-1 — Nền tảng (FE 1–14, BE 1–10)

| Hạng mục | Nội dung |
|---|---|
| Route locale (FE 4) | Mọi trang dưới `src/app/[locale]/` (`/vi`, `/en`); middleware chuyển đường dẫn không tiền tố về `/vi` (ưu tiên cookie `awing_locale`, mặc định vi, không chuyển theo IP); mọi link nội bộ qua `withLocale()` |
| Token + font (FE 3) | Đỏ logo #D2232A, 6 màu sản phẩm, font Be Vietnam Pro (tiêu đề) + Inter, theo Docs §7.2; bỏ token Figma cũ |
| Data layer Strapi (FE 5) | `src/lib/strapi.ts` là client duy nhất cho CMS (lọc locale + market, tag `strapi:<collection>`); `POST /api/revalidate` (secret `REVALIDATE_SECRET`) để FastAPI gọi sau webhook Strapi |
| SEO (FE 6) | `src/lib/seo.ts` — `pageMetadata()` (canonical tự trỏ + hreflang vi/en/x-default + OG), JSON-LD Organization + WebSite, sitemap/robots; mỗi trang đúng 1 h1 (riêng /advertisers không h1 theo Figma) |
| Component dùng chung (FE 7–8) | `src/components/ui/` (Button, Input, Select, Tabs, Breadcrumb, Pagination, Modal, Drawer, Toast) và `src/components/content/` (ProductCard, ContentCard, StatsCard, LockedState); trang `/components` để xem/thử |
| Block renderer (FE 9) | `BlockRenderer` render 10 loại block dynamic zone của Strapi (hero, opportunity, solutions, how-to-plan, showcase, lead-form, rich-text, media, stats, cta); block lạ hiện khung báo thay vì crash |
| Motion (FE 10) | Reveal, Counter, `usePrefersReducedMotion`, tôn trọng `prefers-reduced-motion`; hiệu ứng ribbon logo chưa làm (cần thiết kế motion từ Figma, không đoán) |
| Bảo mật / GTM / 301 / lỗi (FE 11–14) | Security headers (CSP, nosniff, X-Frame-Options DENY, HSTS…); DOMPurify (chỉ client); GTM chỉ load khi có `NEXT_PUBLIC_GTM_ID`, `trackEvent()` không gửi PII; bảng 301 trong `redirects.json` (Next trả 308, Google coi tương đương 301) + script `test:redirects`; 404 song ngữ, `error.tsx`, `global-error.tsx`, `GET /api/health` |
| Content model Strapi (BE 1–10) | Strapi 5.62.0 (đã mới nhất); 9 loại mới (Solution, AdFormat, Resource, Event, Job, Partner, Customer + DataSnapshot, Global); Product mở rộng (tagline, goal, color, order, solutions, blocks); Article giữ làm News; trường `market` (vn/global/id/th) trên mọi collection; 10 block component khớp FE 9 |

### 2.2. R1-2 — Header, lead form (FE 15–21, BE 11–14)

| Hạng mục | Nội dung |
|---|---|
| Header + mega menu (FE 15–17) | IA theo Docs §4.1: Products (mega menu 6 cột theo màu sản phẩm, tên + slogan + solutions), dropdown Data / Insights & Resources / Company (đóng bằng Escape + bấm ngoài); toolbar Search, Sign in, EN/VI, nút đỏ Get data; mobile Drawer + thanh CTA cố định; `SiteChrome` gom trạng thái |
| Search overlay vỏ tĩnh (FE 16) | Lọc ngay trong danh mục tĩnh (6 sản phẩm, 26 solution, 4 trang) — khớp không dấu, cả từ khóa vi/en; search thật qua API ở R1-5 |
| Footer 5 cột (FE 18) | Thương hiệu + mạng xã hội (URL thật chưa chốt — SOC-01) \| Sản phẩm \| Dữ liệu & Tài nguyên \| Công ty + Hỗ trợ \| Liên hệ + form nhận tin (`POST /api/newsletter`); vẫn ẩn trên /advertisers |
| Lead form 3 bước (FE 19–21) | Bắt buộc họ tên/công ty/email/SĐT (E.164 — gõ 0xxx tự đổi +84), tùy chọn ngành/thương hiệu/khu vực/ghi chú; consent tách 2 mục đích; UTM + source ẩn; bước 1 nhập thông tin → bước 2 OTP 6 số → bước 3 bổ sung hồ sơ (PATCH kèm lead token); Turnstile thật khi có site key, chưa có thì "mô phỏng" |
| BE leads + OTP (BE 11–14) | `POST /api/leads` (validate E.164, chống trùng email chưa xác thực 10 phút, rate limit 5/phút); `/verify` (OTP hash SHA-256, TTL 10 phút, tối đa 5 sai, cấp JWT lead 60 phút — **chỉ lead đã xác thực mới vào hàng đợi CRM**); `/resend` (cooldown 60s, tối đa 5 mã/ngày); `PATCH /api/leads/{id}`; `POST /api/newsletter` (202); worker CRM trong tiến trình, chạy mỗi 30s |

### 2.3. Dữ liệu giả toàn bộ + API BE mới (BE 7, 8, 15–20, 9/10/21–24)

| Hạng mục | Nội dung |
|---|---|
| Seed Strapi (BE 7) | `cms/scripts/seed-fake-content.js` (`npm run seed`, `--force` để tạo lại): 6 Product + 26 Solution + 4 AdFormat + 12 Resource + 6 Event + 118 Article + 6 Job + 8 Partner + 6 Customer + 3 CaseStudy + 12 FAQ + DataSnapshot + Global + Home — vi + en, đã publish; Partner/Customer có cờ `consent` (chỉ hiện logo khi đồng ý) |
| Webhook → revalidate (BE 8) | FastAPI nhận webhook Strapi rồi gọi `POST /api/revalidate` của Frontend, xóa tag `strapi:<collection>`; lỗi revalidate chỉ ghi log, webhook vẫn trả 200 |
| Đăng ký sự kiện (BE 15) | `POST /api/events/{slug}/register` (201; trùng email + sự kiện trong 24h → `duplicate: true`); email xác nhận kèm file .ics; đẩy CRM qua `crm_outbox` |
| Nộp CV (BE 16) | `POST /api/jobs/{slug}/apply` (multipart PDF/DOCX ≤ 5 MB, kiểm tra magic bytes; quét virus giả lập; lưu `uploads/cv/<uuid>.ext`; đẩy HR qua `crm_outbox`) |
| Newsletter double opt-in (BE 17) | `POST /api/newsletter` lưu pending + gửi link xác nhận (token chỉ lưu dạng hash, hết hạn 7 ngày); `GET /api/newsletter/confirm` dùng 1 lần |
| Tìm kiếm (BE 18–20) | `GET /api/search` — **không Meilisearch**: đọc nội dung công khai từ Strapi (cache 5 phút), khớp không dấu, lọc locale/market/type, đếm facet; Strapi không tới được thì dùng chỉ mục dự phòng (6 sản phẩm + 26 solution tĩnh trong code) |
| Hạ tầng (BE 9/10/21–24) | Media R1 dùng upload local Strapi + `next/image` AVIF/WebP; object storage/CDN, IP/VPN, role Editor/Author, CI/CD, Sentry, backup — ghi rõ cách làm trong `cms/README.md` và README của BE_inventory, không dựng hạ tầng thật trong R1 |

### 2.4. R1-3 — Home mới + Products/Solutions/AdFormats (FE 22–32)

- **Home mới** (`src/app/[locale]/page.tsx`, server): hero từ Home single +
  tab 6 sản phẩm (màu/CTA đổi theo tab), 6 thẻ sản phẩm, HowItWorks từ CMS,
  dải snapshot từ DataSnapshot single (6 chỉ số, ngày cập nhật — không dùng
  SSE realtime nữa), showcase mới nhất (2 News + 2 Resource + 2 Event), CTA
  cuối trang mở dialog lead, form lead nhúng ở cuối. Hero prompt + heatmap
  + StatsStrip cũ không còn ở Home (heatmap/số realtime ở /locations,
  prompt ở /advertisers).
- **/products** (FE 28): thẻ infographic (số thứ tự, nhãn mục tiêu, tên,
  slogan, mô tả, tối đa 4 solution, cover khi có).
- **/products/[product]** (FE 29): hero riêng + Opportunity + Solutions +
  How to plan + Showcase + Lead form — tất cả từ dynamic-zone blocks của
  Strapi; Breadcrumb + BreadcrumbList schema.
- **/products/[product]/[solution]** (FE 30): nội dung từ blocks của
  solution, solution cùng sản phẩm, case study mới nhất; URL khớp với
  `/api/search` của BE.
- **/ad-formats** (FE 31): lọc theo loại (video/banner/chữ — trường
  `formatType` mới), xem trước trên khung điện thoại, bảng thông số; iframe
  sandboxed + lazy chỉ khi có previewUrl.
- **Tầng dữ liệu:** fetchers products/solutions/ad-formats/resources/events/
  articles/home/snapshot + `mapStrapiBlocks` (DZ → Block); `pageSize` đặt
  rõ (mặc định Strapi chỉ trả 25); ảnh CMS qua `CmsImage` (next/image, alt
  bắt buộc, lazy, AVIF/WebP); dialog lead mở từ mọi client component qua
  `LeadContext`.

### 2.5. R1-4 — Resources, Events, News, Company, Jobs, FAQ (FE 33–44)

- **Trang mới:** /resources (lọc loại/ngành/năm qua URL, phân trang 6) +
  /resources/[slug]; /events (tab Sắp diễn ra/Đã diễn ra, lọc hình thức) +
  /events/[slug] (chương trình, diễn giả, form đăng ký BE 15, nút tải .ics,
  schema Event); /news (118 bài, lọc chuyên mục, phân trang 12) +
  /news/[slug] (NewsArticle JSON-LD + tin liên quan); /case-studies/[slug];
  /about (định vị + số liệu + văn phòng thật — timeline/team chưa có dữ liệu
  CMS nên chỉ ghi chú chờ cập nhật, không bịa tên người/cột mốc); /partners
  (chỉ `consent=true`); /customers; /investors; /privacy, /terms, /cookies
  (bản tóm tắt R1 — văn bản pháp lý đầy đủ do AWING ban hành sau); /careers
  (lọc phòng ban/địa điểm, ẩn vị trí hết hạn) + /careers/[slug] (form nộp CV
  BE 16 + schema JobPosting); /faq (accordion theo nhóm + FAQPage JSON-LD);
  /newsletter/confirm (trang server gọi thẳng BE bằng token trong URL, token
  không lộ ra client).
- **Schema Strapi:** Case Study thêm `slug` (uid từ title); Resource thêm
  `industry` (string) để lọc theo ngành; backfill bằng
  `cms/scripts/backfill-r14.js` cho DB đã seed trước.
- **Component mới:** ArticleTemplate (mục lục tự động từ tiêu đề `## ` +
  JSON-LD), RichText, ShareButtons, FaqAccordion, EventRegistrationForm,
  CvApplicationForm (kiểm tra PDF/DOCX ≤ 5 MB ngay trên trình duyệt, cả đuôi
  lẫn magic bytes), ServerPagination (link giữ bộ lọc).
- **Footer:** đã bật link tới mọi trang mới — chỉ còn Data (R2) và mạng xã
  hội (SOC-01) vẫn mờ.

### 2.6. R1-5 — Search + Social/OG + Contact + E2E + Responsive + Web Vitals (FE 45–53)

- **Tìm kiếm thật (FE 45–47):** `SearchOverlay` gọi `GET /api/search` của
  FastAPI (debounce 200 ms, chống phản hồi cũ đè mới bằng số thứ tự
  request, phím mũi tên + Enter, Esc đóng, Ctrl+K hoặc `/` mở); BE không
  tới được → dùng lại danh mục tĩnh. Trang **/search** (server): query +
  tab + locale trong URL, tab Tất cả/Sản phẩm/Tài nguyên/Sự kiện/Tin tức/
  Tuyển dụng với số đếm từ facet của BE, phân trang 12. Tab "Data" chưa có
  — BE chưa index nội dung dữ liệu, không hiện tab bằng 0; thêm khi R2 có
  index dữ liệu. JSON-LD WebSite thêm `SearchAction`.
- **Mạng xã hội (FE 48):** link Facebook/LinkedIn/YouTube/Zalo OA/TikTok ở
  footer + Contact lấy từ single Global trong Strapi (sửa URL trong CMS là
  đổi luôn cả 2 nơi); URL hiện tại là giá trị seed — **SOC-01 chưa chốt URL
  thật**; `sameAs` trong JSON-LD chưa gắn (chỉ gắn khi chốt URL thật).
- **OG image (FE 49):** `src/app/[locale]/opengraph-image.tsx`
  (ImageResponse 1200×630, nền đỏ + tagline theo locale) + `images` tường
  minh trong `pageMetadata()` + `metadataBase`.
- **Contact (FE 50):** trang server; form liên hệ tách `ContactForm.tsx`;
  bản đồ trụ sở Hà Nội (Google Maps embed, không cần API key); link mạng xã
  hội từ Global; form lead nhúng.
- **E2E trong repo (FE 51):** `e2e/` (Playwright): `lead-otp` (Get data →
  form → mã sai còn 4 lần → mã đúng đọc từ log email giả lập của BE → bổ
  sung hồ sơ → đóng), `redirects` (2 redirect 308), `search` (gợi ý + phím
  + Esc + tab /search); thêm `header-links` ở đợt đóng gói (xem §2.7).
- **Responsive + Web Vitals (FE 52–53):** kiểm tra 360/768/1024/1440; đo
  local: home LCP 557ms / CLS 0 / JS 194KB transfer, product LCP 259ms /
  CLS 0 — đều đạt (LCP < 2.5s, CLS < 0.1, JS < 200KB). Không chạy Lighthouse
  trên VM (chưa cài) — số trên là đo local, không phải Lighthouse.

### 2.7. Đóng gói + review + kiến trúc BFF (24–25/11)

Sau khi merge, tran yêu cầu đóng gói phần hiện tại: review 1 lượt tính năng
chính, tìm bug, tối ưu code, hoàn thiện kiến trúc, cập nhật lại Plan.

- **BFF:** trình duyệt chỉ nói chuyện với Next.js qua proxy
  `src/app/api/backend/[...path]/route.ts` (streaming — SSE chạy qua được;
  `redirect: "manual"` để OAuth 307 tới trình duyệt; forward cookie +
  set-cookie cho OAuth state). `BACKEND_URL` server-only thay
  `NEXT_PUBLIC_API_BASE_URL` (đã xóa khỏi `.env.example`, compose,
  `api.ts`); production không đặt `BACKEND_URL` → proxy trả 503
  `BACKEND_NOT_CONFIGURED`. CSP: `connect-src 'self'`; `img-src 'self'
  data: https://lh3.googleusercontent.com` (avatar Google). Ảnh CMS qua
  `/_next/image`, không `<img>` thẳng sang Strapi. **Hệ quả:** redirect URI
  OAuth mới `{FRONTEND_ORIGIN}/api/backend/auth/google/callback` — phải
  đăng ký lại trên Google Cloud Console trước khi đăng nhập Google thật chạy
  lại.
- **Review BE + CMS:** 1 blocker + 6 major + 16 minor — đã sửa + verify
  live (chi tiết §3.3).
- **Review FE:** 2 blocker + 10 major + ~30 minor — đã sửa + verify
  (chi tiết §3.4). E2E mới `e2e/header-links.spec.ts` (2 test).
- **Push 25/11:** FE main `06197bc5` (242 file — file xlsx kế hoạch loại
  khỏi snapshot vì binary, bản trên GitHub giữ nguyên), BE main `16f31d87`
  (38 file); xóa 4 component Home cũ mồ côi khỏi remote main (Hero,
  CampaignPromptForm, StatsStrip, LocationIntelligence — head FE main
  `60e5216a`); verify lại: `backend.ts` + `rate_limit.py` có trên remote,
  Hero.tsx đã mất.

## 3. Vấn đề gặp phải và giải pháp đã áp dụng

Mỗi mục ghi theo dạng: **Vấn đề → Nguyên nhân → Giải pháp → Kiểm chứng**.
Các mục "chưa sửa" được ghi rõ lý do và điều kiện làm sau.

### 3.1. Next.js 16 + `cacheComponents` (ảnh hưởng toàn bộ R1)

Phiên bản Next.js 16.4.6 có nhiều thay đổi phá vỡ so với Next.js trước đây
(xem `AGENTS.md` trong repo: "This is NOT the Next.js you know" — đọc guide
trong `node_modules/next/dist/docs/` trước khi viết code).

| # | Vấn đề | Nguyên nhân | Giải pháp | Kiểm chứng |
|---|---|---|---|---|
| 3.1.1 | `export const dynamic = "force-dynamic"` bị cấm, build lỗi | `cacheComponents: true` cấm ép dynamic bằng export | Trang CMS dùng `await connection()` (từ `next/server`) + `export const instant = false` để thành route chặn, đọc Strapi ở mỗi request | Build pass; các trang CMS (/products, /news, /newsletter/confirm…) chạy đúng |
| 3.1.2 | Fetch Strapi mặc định UNCACHED dưới cacheComponents → build lỗi prerender | Fetch trong context tĩnh mà không cache thì Next không prerender được | Layout `getGlobal` dùng `"use cache"` + `cacheTag("strapi:global")`; lỗi phải bắt **bên trong** hàm `"use cache"` (fix của tran, commit `8e205c2` — force-cache đơn thuần không còn được tính là cached) | Build pass sau fix của tran |
| 3.1.3 | `new Date()` trong layout làm build lỗi prerender (/privacy, /customers, /products/[product]) | Giá trị `new Date()` không cache được trong context tĩnh | Năm bản quyền tính trong helper `"use cache"` `getYear()` ở `[locale]/layout.tsx`, truyền xuống Footer qua prop `year` | Build pass |
| 3.1.4 | `runtime = "edge"` bị cấm | cacheComponents cấm edge runtime | Bỏ `runtime = "edge"` ở `opengraph-image.tsx` (ImageResponse chạy được ở Node runtime) | OG image trả PNG 200 |
| 3.1.5 | Hai dynamic segment cùng vị trí phải cùng tên param | Quy tắc routing mới của Next 16 | `/products/[slug]` đổi thành `/products/[product]` (trùng với route solution) | Build pass, route solution hoạt động |
| 3.1.6 | `params` / `searchParams` là Promise | Async request APIs trong Next 16 | `await` params/searchParams trước khi dùng (mọi page động) | Build + E2E pass |
| 3.1.7 | Layout đọc Global (fetch `strapi:global` không cache) làm build lỗi prerender ở trang tĩnh /advertisers | Fetch không cache trong layout tĩnh | `strapiSingle` thêm tham số `cache`; `fetchGlobal` dùng `cache: "force-cache"` (revalidate bằng tag khi Strapi publish, BE 8); trang động vẫn đọc mới mỗi request | Build pass (R1-5) |
| 3.1.8 | Sau mỗi `npm run build`, file tĩnh thiếu trong `.next/standalone` | Next 16 standalone: `npm run build` xóa `.next/standalone/.next/static/` | Copy `.next/static` + `public` vào standalone **sau mỗi lần build**, kill server cũ trước (Dockerfile đã xử lý cả hai) | Server standalone chạy đúng sau build |

### 3.2. Strapi 5 — data layer và seed

| # | Vấn đề | Nguyên nhân | Giải pháp | Kiểm chứng |
|---|---|---|---|---|
| 3.2.1 | Dynamic zone: `populate=blocks` không trả repeatable lồng trong block (items/steps) | Strapi chỉ populate 1 cấp theo mặc định | Thêm `populate[blocks][populate]=*` (deep populate, dạng `populate[x][populate]=*` thống nhất) | Trang chi tiết product/solution render đủ 5 khối |
| 3.2.2 | Trộn 2 dạng populate trong 1 request → 400 | Strapi cấm trộn chuỗi `"a,b"` + object, và cấm trộn `populate[x]=*` với `populate[y][populate]=*` | `appendPopulate` dùng thống nhất dạng `populate[x][populate]=*` khi có deep populate | Không còn 400 khi fetch DZ |
| 3.2.3 | `pageSize` mặc định 25, tối đa 100 — 118 bài News bị cắt (trang 10 biến mất) | Giới hạn pageSize của Strapi | `fetchArticles` đọc nối 2 trang (100 + 18); `strapiList` thêm tham số `page`; sitemap dùng limit 200 | Đủ 118 bài, 10 trang phân trang; sitemap đủ URL news |
| 3.2.4 | `fetchEvents`/`fetchArticles` map trường `summary` không tồn tại | Event có `description`, Article có `content` — không có `summary` | Tóm tắt = đoạn đầu của richtext (`richTextExcerpt`) | Thẻ showcase ở Home và danh sách có mô tả |
| 3.2.5 | Relation chỉ lưu theo từng locale | Strapi lưu relation **per locale** | Seed đặt relation ở cả vi và en | Relation đúng cả 2 locale qua REST |
| 3.2.6 | Richtext validate dạng string, không phải Blocks JSON | Cấu hình richtext của project này | Seed ghi text thuần; FE render bằng cách tách đoạn | Nội dung article hiển thị đúng |
| 3.2.7 | **B3 — 6 Product chỉ có bản en, không có bản vi** (phát hiện ở đợt đóng gói): `/vi/products/[product]` + solution 404 (FE trả 200 kèm nội dung 404); sitemap thiếu 32 URL | Nguyên nhân gốc chưa xác định (hàm `createBilingual` trong seed đối xứng); lỗi bị che từ R1-3 vì `/vi/products` vẫn hiện tên nhờ fallback tĩnh `products.ts` | Chạy lại `npm run seed -- --force` (xóa hết + seed lại đủ 2 locale). **Không chạy seed thường** — guard `countDocs(vi) === 0` sẽ tạo document trùng thay vì thêm locale vi | **Chưa verify live** — xem 3.2.8; cần chạy trên máy tran |
| 3.2.8 | `npm run seed -- --force` chết 3 lần trên VM này (2 lần OOM-killed exit 137, lần 3 kẹt ở bootstrap, RSS leo tới 5.8GB rồi phải kill tay theo PID) | VM chỉ có ~6GB RAM chia sẻ; `compileStrapi()` chỉ biên dịch TS nên lỗi không nằm ở build admin — quá trình boot/load Strapi qua script ngốn RAM bất thường, trong khi `strapi develop` chạy bình thường trên cùng VM | Không cố chạy tiếp trên VM (DB đã kiểm tra còn nguyên vẹn: 472 article, 24 event); chạy `npm run seed -- --force` trên máy tran (Docker, đủ RAM) — đây cũng là cách verify các sửa seed N15 + bootstrap N14 | Script đã qua `node --check`; các sửa N15 dùng đúng API cũ |
| 3.2.9 | Seed dở dang (vi có, en thiếu) bị bỏ qua ở lần chạy sau | Guard cũ chỉ kiểm tra vi | Seed ghi log WARNING khi một collection có vi mà không en; single chỉ tồn tại dạng draft không làm `--force` lỗi; backfill phân trang qua 100 | Đã sửa trong code, chờ verify live bằng lần seed --force trên máy tran |
| 3.2.10 | Bootstrap cấp quyền public thừa + webhook mồ côi | Quyền đã cấp mà sau này bỏ khỏi `PUBLIC_ACTIONS` vẫn còn hiệu lực; webhook đổi URL tạo bản ghi mới, bản cũ vẫn bắn về URL cũ | Bootstrap thu hồi quyền public thừa; webhook cập nhật theo tên `awing-backend` | Đã sửa, chờ verify live bằng lần seed trên máy tran |

### 3.3. Backend FastAPI — lỗi tìm thấy trong lúc build và đợt review đóng gói

| # | Vấn đề | Nguyên nhân | Giải pháp | Kiểm chứng |
|---|---|---|---|---|
| 3.3.1 | Chrome gửi preflight kèm `Access-Control-Request-Private-Network` khi trang 127.0.0.1 gọi API cổng khác → Starlette trả 400, form lead không gửi được từ trình duyệt dù curl vẫn 200 | Thiếu `allow_private_network=True` | Thêm `allow_private_network=True` vào CORS trong `app/main.py` | Lead form gửi được từ trình duyệt thật (Playwright 32/32) |
| 3.3.2 | Bổ sung hồ sơ (PATCH) bị chặn | `allow_methods` thiếu `PATCH` | Thêm `PATCH` vào `allow_methods` | Luồng lead → OTP → PATCH hoàn tất trong E2E |
| 3.3.3 | **B1 (blocker, review đóng gói):** `POST /api/leads/{id}/verify` cấp token mới cho lead đã xác thực mà **không cần OTP** — ID lead đoán được (sequential) → chiếm token người khác, sửa được hồ sơ/consent của họ | Nhánh shortcut "đã verified thì cấp token luôn" | Bỏ shortcut: verify **luôn** kiểm tra OTP; resend là cách duy nhất lấy token mới (cooldown 60s + 5 mã/ngày giữ nguyên); CRM chỉ queue đúng 1 lần ở lần xác thực đầu | Live: mã sai trên lead đã verified → 400, không lộ token; `crm_jobs` vẫn 1 |
| 3.3.4 | **M1:** Search fallback: toàn bộ 26 URL solution hỏng (`/products//<slug>`) khi Strapi không tới được | Tuple `_FALLBACK_SOLUTIONS` là `(solution_slug, name, product_slug)` — generator dùng sai vị trí | Sửa generator `_fallback_items` | Verify: 32 item, 0 URL hỏng |
| 3.3.5 | **M2:** Upload CV đọc hết file vào RAM trước khi kiểm tra size; không rate limit; file mồ côi khi insert DB lỗi; `file_path` tuyệt đối | Đọc `await file.read()` toàn bộ | Pre-check `Content-Length` (> MAX_CV_BYTES + 64KB từ chối trước khi đọc), đọc theo chunk 64KB có giới hạn cứng, rate limit 3/phút/email, insert lỗi thì xóa file đã lưu, `file_path` lưu tương đối `cv/<uuid>.ext` | Live: PDF hợp lệ → 201 với path tương đối; file 6MB → 400 `FILE_TOO_LARGE` |
| 3.3.6 | **M3:** OAuth Google: `state` sinh ra nhưng không kiểm tra; lỗi Google phản chiếu nguyên văn; không kiểm tra `email_verified` | State chỉ sinh, không lưu/đối chiếu | `state` lưu cookie HttpOnly SameSite=Lax (`oauth_state`, max_age 600), callback đối chiếu (sai → 400 `OAUTH_STATE_MISMATCH`); `email_verified is False` → 400; bỏ xin refresh token không dùng | Verify qua proxy: Set-Cookie đi qua, sai state → 400, đúng state thiếu code → 400 `OAUTH_NO_CODE`. JWT vẫn trả qua `?auth_token=` (FE đọc rồi dọn khỏi URL ngay) — giữ theo thiết kế |
| 3.3.7 | **M4:** `JWT_SECRET` mặc định hardcode trong repo; webhook chấp nhận POST không chữ ký | Giá trị mặc định trong code | **Fail-closed: thiếu `JWT_SECRET` là backend không khởi động** (RuntimeError); trùng giá trị mẫu thì log cảnh báo lớn; webhook không secret thì cảnh báo lúc boot. **Hệ quả: mọi lần chạy/restart BE (kể cả `scripts/import_csv.py`) đều cần `JWT_SECRET` trong env** | Backend từ chối khởi động khi thiếu secret (đã thử) |
| 3.3.8 | **M5/M6:** Rate limit chỉ có ở `/api/leads`; lấy IP từ `request.client.host` — sau reverse proxy mọi user chung 1 IP; bucket không bao giờ dọn | Chưa có module rate limit chung | Module mới `app/rate_limit.py` (bucket theo chuỗi, `client_ip()` lấy `X-Forwarded-For` đầu tiên, tự dọn khi > 10.000 key). Giới hạn **theo email** (sau BFF mọi request mang IP proxy nên giới hạn theo IP thành giới hạn toàn site): leads/contact/newsletter/event 5/phút, CV 3/phút; suggest theo IP 30/phút | Live: lead thứ 6 cùng email → 429 (chuỗi [201×4, 429, 429]); suggest flood → 429 |
| 3.3.9 | **N1:** OTP so hash bằng `==` | So sánh chuỗi thường (timing attack) | `hmac.compare_digest` | Đã sửa |
| 3.3.10 | **N3:** ICS không escape; tz lỗi (`+25:00`) gây 500 | Thiếu escape RFC 5545 | Escape `\`, `;`, `,`, xuống dòng; tz lỗi → None thay vì 500 | Đã verify |
| 3.3.11 | **N4:** `queue_lead_sync` lỗi sau khi đã verified biến verify thành công thành 500 | Không bắt lỗi ở bước queue | try/except + log, verify vẫn 200 | Đã sửa |
| 3.3.12 | **N11:** Newsletter confirm với `created_at` sai định dạng bỏ qua kiểm tra hết hạn | Parse lỗi được bỏ qua | Fail-closed → 400 `TOKEN_EXPIRED` | Đã verify live |
| 3.3.13 | **N5/N6/N7/N10/N14/N15:** index DB thiếu; `@app.on_event` deprecated; comment growth sai; requirements chưa pin; bootstrap Strapi; seed agenda/speakers | Nợ nhỏ tích lũy trong lúc build | Index `leads(email)`, `lead_otps(lead_id)`, `event_registrations(event_slug, email)`; `@app.on_event` → `lifespan`; comment growth sửa thành +13/kỳ; pin fastapi 0.163.2, uvicorn 0.54.0, pydantic 2.14.3, PyJWT 2.15.1, python-multipart 0.0.34; bootstrap thu hồi quyền thừa + webhook theo tên; seed có agenda/speakers tiếng Anh riêng | Đã sửa + verify live (trừ N14/N15 chờ seed --force trên máy tran) |
| 3.3.14 | **Chưa sửa (ghi nhận):** N2 — race nhỏ ở verify OTP + dedupe lead/event (cần UNIQUE index/transaction); N8 — search index build lần đầu ~120s (không deadline tổng, không lock chống stampede); N9 — SSE queue không giới hạn, CRM worker sync chặn event loop, multi-worker Uvicorn chạy trùng worker (thiết kế hiện tại single-worker) | Cần thay đổi thiết kế/lớn hơn, ngoài phạm vi R1 | Ghi nhận làm sau khi cần | — |

### 3.4. Frontend — lỗi tìm thấy ở đợt review đóng gói (24/11)

| # | Vấn đề | Nguyên nhân | Giải pháp | Kiểm chứng |
|---|---|---|---|---|
| 3.4.1 | **B1:** /locations hiện tỉnh "63/32" thay vì "/63" | Thiếu dữ liệu sau import | Chạy `scripts/import_csv.py` (76 dòng) + kiểm tra bằng trình duyệt thật | "63/63" hiển thị đúng |
| 3.4.2 | **B2:** /advertisers + /locations mang canonical/title của trang chủ | Trang client kế thừa metadata của layout gốc | Thêm `layout.tsx` riêng từng segment với `pageMetadata()` đúng; /components + /newsletter/confirm thêm `robots: noindex` | Canonical tự trỏ đúng trang |
| 3.4.3 | **M1:** Header có 11 mục menu chết (không link / link sai) | Menu xây trước khi các trang R1-3/R1-4 có | Nối link thật (Reports/Papers/Case Studies → `/resources?type=…`, Events → /events, News → /news, Company → /about, /partners, /customers, /investors, /careers); tên sản phẩm + 26 solution trong mega menu và mobile drawer thành Link; 3 mục Data chưa có trang (R2) gỡ khỏi menu + footer | E2E header-links: không còn mục chết |
| 3.4.4 | **M2:** Mega menu tự đóng khi bấm vào trong | `navRef` đặt ở div hẹp bên trong, click trong menu bị tính là click ngoài | Dời `navRef` lên `<header>` | Bấm trong menu không đóng nữa |
| 3.4.5 | **M3+M4:** Modal/Drawer không cuộn được + không focus trap | Modal/Drawer cũ tự viết, thiếu xử lý | Hook dùng chung `src/components/ui/useFocusTrap.ts` (Tab quấn vòng, Escape đóng, focus trả về trigger, khóa cuộn body); Modal + Drawer viết lại trên hook, `overflow-y-auto` + `max-h-[calc(100vh-2rem)]`; 2 modal cũ (AdvertiserAuthModal, FormatPreviewModal) chuyển sang `ui/Modal` | Đóng bằng Escape hoạt động; nội dung dài cuộn được |
| 3.4.6 | **M5:** Dropdown không điều hướng bằng phím mũi tên | Thiếu xử lý phím | `onMenuKeyDown` (ArrowDown/Up/Home/End) + `aria-haspopup="menu"` ở Header và AuthSession | E2E header-links kiểm phím mũi tên |
| 3.4.7 | **M6:** JobPosting JSON-LD `datePosted` lấy bằng deadline (sai); job type lạ mặc định full-time | Map sai trường | Bỏ `datePosted`, giữ `validThrough`; type lạ hiện giá trị gốc | JSON-LD đúng |
| 3.4.8 | **M7:** Sitemap tĩnh, thiếu URL động | Sitemap ban đầu chỉ 4 route tĩnh × 2 locale | Viết lại sitemap async/dynamic: 17 route tĩnh + products/solutions/resources/events/news/careers/case-studies từ Strapi, `lastModified` từ publishedDate/startDate, try/catch về tĩnh-only khi lỗi | Sitemap 162 `<loc>` với DB seed hiện tại (sẽ là 194 sau khi sửa B3) |
| 3.4.9 | **M9/M10:** Nhãn "Email *" không theo locale; case study ở trang solution không phải link | Hardcode / thiếu Link | Nhãn email dùng key `lead.nameCompanyRequired` / `form.email` theo locale; thẻ case study bọc trong Link tới `/case-studies/{slug}` | Đã sửa |
| 3.4.10 | **Minor (~30 mục):** SearchOverlay `aria-controls` khi list chưa render; Tabs thiếu id/aria-controls; Pagination thiếu ariaLabel bản địa; AdFormatCatalog "—%" ×3; `todayIso()` dùng UTC thay vì Asia/Ho_Chi_Minh; event đang diễn ra không tính upcoming; /resources chưa sort phía server; showcase Home fetch 200/100/100 thay vì 3 mới nhất; số điện thoại ContactInfo không phải `tel:`; Button disabled+href vẫn bấm được; RichText mất cấp h1/h2/h3 + trùng heading id; Turnstile không dọn widget khi unmount; /search không báo lỗi khi tab request fail; ProductColor định nghĩa trùng; ContentCard nhiều link; link "Tìm hiểu ngay" nằm trong vùng role=button; h1 /locations nằm ngoài `<main>`; ICS phía trình duyệt thiếu DTSTAMP + escape | Nợ nhỏ tích lũy | Sửa từng mục theo danh sách trong SETUP.md §6.18 (sort qua option `sort` mới của strapiList; `todayIso()` dùng Intl Asia/Ho_Chi_Minh; event so sánh endDate; showcase fetch 3 mới nhất + sort server; `tel:` link; Button disabled chặn click + aria-disabled; RichText giữ cấp heading + dedupe id; v.v.) | E2E 8/8 + smoke 19 route sau đóng gói |
| 3.4.11 | **Không sửa (ghi nhận + lý do):** xóa 4 component Home cũ mồ côi — cần tran đồng ý (**đã xóa ngày 25/11 sau khi tran bấm "Push luôn + xóa 4 component cũ"**); chip lọc giữ `aria-current` (link điều hướng, `aria-pressed` chỉ dành cho nút toggle); tooltip heatmap bàn phím, `sizes` ảnh hero, `<html lang>` động — để đợt sau | Quyết định có chủ ý | Ghi nhận | — |

### 3.5. Kiểm thử và vận hành — bài học trong lúc verify

| # | Vấn đề | Giải pháp |
|---|---|---|
| 3.5.1 | Playwright `waitUntil: networkidle` treo mãi vì SSE không bao giờ idle | Dùng `domcontentloaded` + chờ tường minh (explicit waits) |
| 3.5.2 | Locator trùng text/id giữa trang + dialog + footer (vd. nút "Nhận dữ liệu") | Scope locator vào `dialog` / `main` cụ thể |
| 3.5.3 | `innerText` phản ánh CSS uppercase (vd. "INSIGHTS") làm so sánh chuỗi sai | So sánh không phân biệt hoa/thường |
| 3.5.4 | Kiểm tra JSON-LD thiếu schema vì chỉ đọc 1 script | Nối tất cả `script[type="application/ld+json"]` rồi mới kiểm |
| 3.5.5 | Token newsletter và mã OTP dùng 1 lần — chạy lại test cũ thất bại | State mới cho mỗi lần chạy (lead/token mới) |
| 3.5.6 | Đọc mã OTP từ log BE bằng string slice cắt sai | Đọc bằng **Buffer byte-slice**, không dùng string slice |
| 3.5.7 | `curl` xử lý `[...]` trong URL như glob range → URL Strapi có `pagination[pageSize]=...` fail lặng lẽ | Luôn dùng `curl -g` cho URL có ngoặc vuông (FE không ảnh hưởng vì URLSearchParams encode ngoặc) |
| 3.5.8 | `pkill -f <pattern>` giết luôn shell đang chạy lệnh (pattern trùng chính lệnh) — xảy ra nhiều lần, kể cả khi kill tiến trình seed | Kill theo **PID chính xác** từ `ss -tlnp`; không dùng `pkill -f` với pattern chứa trong lệnh |
| 3.5.9 | Restart runtime/service xóa /tmp và giết hết server test giữa chừng — tưởng là lỗi code | Trước khi kết luận lỗi, kiểm tra lại `ss -tlnp` xem server còn sống không; khởi động lại stack rồi chạy lại suite |
| 3.5.10 | `cd X && cmd &` background cả chuỗi lệnh, không chỉ `cmd` | Tách lệnh hoặc dùng subshell rõ ràng khi chạy server nền |
| 3.5.11 | Snapshot push không đẩy được file binary (xlsx kế hoạch) và không xóa được file | Loại file binary khỏi manifest (file trên remote giữ nguyên); xóa file bằng `delete_file` từng file (mỗi file 1 approval). Đẩy file đã đổi tên có thể tự xóa đường dẫn cũ trên remote — nhưng không đáng tin, luôn verify bằng dry-run sync sau push |
| 3.5.12 | Playwright 1.65.1 đòi chromium_headless_shell-1255 chưa cài | Pin `@playwright/test` ở 1.49.x (khớp chromium-1148 đã có trong `~/.cache/ms-playwright`) |
| 3.5.13 | Build nặng (~35–150s) + seed Strapi ngốn RAM trên VM 1.5 CPU / 6GB RAM | Chạy tuần tự, không chạy song song job nặng; dừng server không cần thiết trước khi seed |

## 4. Công nghệ sử dụng

| Thành phần | Công nghệ / phiên bản | Dùng cho |
|---|---|---|
| Frontend | Next.js 16.4.6 (App Router, Turbopack mặc định, `cacheComponents`) + React 19.3 + TypeScript strict + Tailwind CSS 4.3.3 | Toàn bộ giao diện, SSR + route handler BFF (`/api/backend/*`), sitemap/robots/OG động |
| Styling/token | Be Vietnam Pro (tiêu đề) + Inter (nội dung); token màu theo Docs §7.2 (đỏ logo #D2232A, 6 màu sản phẩm) | Giao diện khớp Figma + định vị mới |
| CMS | Strapi 5.62.0 + PostgreSQL (trong Docker Compose); SQLite khi verify local (cài tay `better-sqlite3 --no-save` vì đã bỏ khỏi package.json để image Docker không build native) | 13 content type + 15 block component, i18n vi/en, webhook publish, MCP server tích hợp (`POST /mcp`) |
| Backend | FastAPI 0.163.2 + Uvicorn 0.54.0 (standard) + Pydantic 2.14.3 + PyJWT 2.15.1 + python-multipart 0.0.34 + SQLite | Leads/OTP, newsletter, events, CV, search, webhook→revalidate, SSE realtime (vòng lặp 30s, growth +13 connections/kỳ, mặc định) |
| Auth | Google OAuth 2.0 (BE) + JWT tự quản (PyJWT, access token 24h cho tài khoản, JWT lead 60 phút); OTP 6 số hash SHA-256 | Đăng nhập Google, xác thực lead, bổ sung hồ sơ |
| Realtime | SSE (`GET /api/events/stats`, full snapshot mỗi 30s) + fallback polling 60s phía FE | Số liệu mạng lưới realtime ở /locations (trước R1-3); Home R1-3 chuyển sang snapshot hàng ngày từ CMS |
| Tìm kiếm | FastAPI tự viết (đọc Strapi live, cache 5 phút, khớp không dấu, facet) — **không dùng Meilisearch** theo kiến trúc đã chốt | `/api/search` + SearchOverlay + trang /search |
| Biểu đồ | Recharts 3.11.0 | Heatmap + 2 biểu đồ ở /locations, biểu đồ xu hướng |
| Sanitize | DOMPurify ^3.5.0 (chỉ client) | Render HTML từ Strapi khi cần (R1 rich-text dùng plain text nên chưa gọi tới) |
| Kiểm thử | Playwright `@playwright/test` 1.49.1 (khớp chromium-1148 đã cài) + script `test:redirects` | E2E trong repo (`e2e/`: lead-otp, redirects, search, header-links), verify từng phase 32/32 → 53/53 |
| Tracking | Google Tag Manager (`NEXT_PUBLIC_GTM_ID`, tắt hẳn khi trống) + `trackEvent()` → `window.dataLayer` (không gửi PII) | `lead_form_submit`, `contact_form_submit` |
| Hạ tầng chạy | Docker Compose (Postgres + Strapi + Frontend; FastAPI chạy trên host bằng venv `.venv`, Uvicorn — **không** trong Compose, theo quyết định từ đầu); Node v24.22.1, npm | Môi trường dev/staging của tran (VM này không có Docker) |
| Quản lý code | GitHub `win95/FE_inventory` + `win95/BE_inventory`; snapshot push qua connector GitHub (UTF-8 text only, manifest NUL-delimited) + `delete_file` từng file để xóa | Push FE 8089b8f1 / BE b2312575 (r1-2), merge PR #1, push đóng gói FE 06197bc5 / BE 16f31d87 |

## 5. Kết quả kiểm chứng

| Đợt verify | Kết quả | Ghi chú |
|---|---|---|
| R1-2 (Playwright) | **32/32** | Header/mega menu, search overlay, lead → OTP → bổ sung hồ sơ, footer, mobile |
| R1-3 (Playwright) | **33/33** | Home mới, /products, chi tiết product/solution, /ad-formats, EN + 404 |
| R1-4 (Playwright) | **53/53** | Resources, events, news (118 bài), case study, company, careers + CV, FAQ, newsletter confirm |
| R1-5 (Playwright) | **34/34 + E2E 6/6** | Search thật, social, OG, contact, responsive, Web Vitals; hồi quy R1-3 33/33 + R1-4 53/53 vẫn pass |
| Đóng gói (24/11) | **E2E 8/8** (6 cũ + 2 header-links mới); smoke 19 route đều 200; tsc sạch; lint 0 lỗi / 3 warning cũ; build pass | Lead → OTP → verify → PATCH qua proxy OK; rate limit trả 429 đúng; CV 6MB từ chối; OAuth state qua proxy OK; bundle client không còn địa chỉ backend |
| Web Vitals (local) | Home LCP 557ms / CLS 0 / JS 194KB transfer; product LCP 259ms / CLS 0 | Đạt (LCP < 2.5s, CLS < 0.1, JS < 200KB); đo bằng PerformanceObserver, không phải Lighthouse |
| Push + merge | r1-2: FE `8089b8f1` (233 file), BE `b2312575` (37 file); merge PR #1 vào main 24/11 (FE `e046e64`, BE `0867f77`); đóng gói: FE `06197bc5`, BE `16f31d87` (25/11) | Verify remote head + spot-check nội dung sau mỗi lần push |

## 6. Hạn chế còn lại và việc chờ quyết định

- **Dữ liệu/tích hợp giả lập (theo quyết định R1):** CRM, email, Turnstile
  chỉ ghi log `[FAKE …]`; quét virus CV giả lập; số liệu mạng lưới từ CSV
  mẫu (76 dòng) + vòng lặp tăng trưởng giả lập. Thay bằng provider thật
  khi tran chốt quyết định §10.
- **B3 chưa sửa xong:** 6 Product chỉ có bản en — cần `npm run seed --
  --force` trên máy tran (xem 3.2.7–3.2.8). Tới lúc đó /vi/products/[product]
  + solution vẫn 404 và sitemap thiếu 32 URL.
- **FE 54 UAT + go-live:** của tran.
- **6 quyết định Plan §10 (chưa chốt):** CRM thật cho production; số phận
  `/advertisers` + `/locations` (tạm tính: giữ năng lực, đổi địa chỉ, 301);
  GA4/GTM IDs (code đã sẵn, cần ID); Turnstile + email provider thật; bảng
  572 URL redirect (cần BA); ảnh thật + file Figma thiết kế gốc; SOC-01 URL
  mạng xã hội thật.
- **Nợ kỹ thuật ghi nhận:** N2 (race OTP/dedupe), N8 (search index build
  ~120s), N9 (SSE queue không giới hạn, CRM worker sync, single-worker) —
  xem 3.3.14. Ngoài ra: skill text session vượt budget (không thuộc R1);
  `<html lang>` SSR vẫn là vi (đổi bằng JS khi hydrate); hiệu ứng ribbon
  logo chưa làm; bộ lọc Resources theo sản phẩm (schema thiếu relation
  product); About chưa có timeline/team thật; mục lục T.Article chỉ hiện khi
  biên tập viên viết tiêu đề `## `.
- **Việc tran cần làm trên máy của tran (sau pull bản đóng gói):** đặt
  `JWT_SECRET` cho BE (bắt buộc — thiếu là BE không khởi động); `BACKEND_URL`
  cho FE (thay `NEXT_PUBLIC_API_BASE_URL`); đăng ký lại redirect URI Google
  `{FRONTEND_ORIGIN}/api/backend/auth/google/callback`; `docker compose up
  --build -d` (lần chạy Compose thật đầu tiên — chưa verify); restart backend
  host; chạy lại `python scripts/import_csv.py` (76 dòng); `npm run seed --
  --force` trong `cms/`; tạo tài khoản admin Strapi đầu tiên + admin API
  token (để verify MCP `tools/list`); tạo Google OAuth client cho đăng nhập
  thật.
- **R2 chưa bắt đầu** — kế hoạch đã viết
  (`ke-hoach-r2-awing-website-2-0/ke-hoach-r2.md`); 3 quyết định đang chờ
  tran: D-R2-01 duyệt ma trận mở khoá §6.3, D-R2-04 OIDC (Keycloak tự host
  vs Auth0), D-R2-05 dark mode cho /data. R2-1 (BE 27–30 + BE 31–35) làm
  được ngay trên cơ sở đã đề xuất (FastAPI /v1, ETL mô phỏng trên SQLite,
  export jobs bằng FastAPI background tasks) — tran đã chọn "chờ chốt 3
  quyết định đã" (25/11 09:11).

## 7. Tài liệu liên quan

- `Docs/Docs_AWING_Website2.0.md` — tài liệu đặc tả sản phẩm (571 dòng)
- `Docs/Break task - AWING Website 2.0.xlsx` — bảng task FE 1–79 + BE 1–51
  (file nhị phân, chỉ có ở local + GitHub, không đẩy qua snapshot)
- `SETUP.md` §6.9–§6.18 — hướng dẫn setup + nhật ký chi tiết từng phase R1
  và đợt đóng gói
- `ke-hoach-r1-awing-website-2-0/ke-hoach-r1-awing-website-2-0.pdf` — kế
  hoạch R1 gốc (13 trang, 23/11/2026)
- `ke-hoach-r1-awing-website-2-0/ke-hoach-r1-cap-nhat-2026-11-24.md` — cập
  nhật kế hoạch sau đợt đóng gói (BFF + review B1/M1–M6/B3)
- `ke-hoach-r2-awing-website-2-0/ke-hoach-r2.md` — kế hoạch R2 (FE 55–71 +
  BE 27–44), R3, R4
- `cms/README.md` — Strapi content model, bootstrap, webhook, MCP
- README của `BE_inventory` — API FastAPI, fake providers, CRM outbox
