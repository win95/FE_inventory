# AWING — Home Public (FE_inventory)

Home Public theo Figma (https://plank-metal-22306544.figma.site/): Menu, Hero +
Search bar, dải số liệu, heatmap phủ sóng, How AWING Works, Lead form, đăng
nhập Google, Footer, trang kết quả tìm kiếm (`/advertisers`), màn Location
Network (`/locations`) và Contact Us (`/contact`). Chi tiết phân tích từng
chức năng: xem Plan AWING 24 trang (`awing-plan-phan-tich-chuc-nang`).

- **Stack:** Next.js 16.4.6 (App Router, Turbopack) + React 19 + TypeScript (strict) + Tailwind CSS 4
- **Cấu trúc:** `src/app/` (route), `src/components/`, `src/lib/` (tầng gọi API duy nhất), alias `@/*` → `src/*`
- **Dữ liệu (mô hình lai đã chốt):** nội dung blog / case study / product / home
  lấy qua Strapi CMS (`NEXT_PUBLIC_STRAPI_URL`); dữ liệu nghiệp vụ (gợi ý, số
  liệu, heatmap, Lead/Contact) lấy qua backend FastAPI + SQLite
  (`NEXT_PUBLIC_API_BASE_URL`), xem `.env.example`. Không mock, không số liệu
  ghi cứng — database rỗng thì giao diện hiện trạng thái rỗng. Realtime:
  backend loop-push toàn bộ dữ liệu, trễ tối đa 1 phút; Frontend nhận qua SSE,
  mất SSE thì polling mỗi 60 giây.
- **Chạy local:** `npm run dev` → http://localhost:3000 · `npm run build` · `npm run lint`
- **Env:** copy `.env.example` sang `.env.local` khi có API thật
- **Setup toàn bộ hệ thống (Frontend + FastAPI + Strapi + Docker Compose):** xem `SETUP.md`
- **Strapi CMS:** `cms/` (Strapi 5, TypeScript) — Article, Case Study, Product, Home; chạy cùng Postgres + Frontend bằng `docker-compose.yml`
- **Backend FastAPI:** repo riêng [win95/BE_inventory](https://github.com/win95/BE_inventory)

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
