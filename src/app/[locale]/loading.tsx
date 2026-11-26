// Loading chung cho mọi route con của [locale] (P0 K8s FE + cache).
//
// Next 16 + cacheComponents: trang đọc `params` (chi tiết [product] /
// [solution] / [slug] — không có generateStaticParams) hoặc
// `searchParams` (danh sách resources/events/news/careers — phân
// trang/lọc) là "dynamic hole": không có Suspense boundary thì build lỗi
// (blocking-prerender-dynamic). File này bọc mọi page con trong Suspense
// nên shell tĩnh (layout + header) prerender được, nội dung trang
// stream về sau — fetch Strapi đã cache nên stream xong rất nhanh.
// Trang tĩnh hoàn toàn không bao giờ hiện loading này. Trang dynamic
// giữ `instant = false` (search/contact/newsletter/confirm) là blocking
// nên cũng không hiện. Skeleton trung tính (không chữ theo locale).
export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true">
      <div className="h-9 w-2/3 animate-pulse rounded bg-surface" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-surface" />
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </div>
    </main>
  );
}
