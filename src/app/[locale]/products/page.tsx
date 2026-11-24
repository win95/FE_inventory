// Trang danh sách sản phẩm (R1-3, FE 28): 6 sản phẩm từ Strapi, thứ tự +
// màu + nội dung từ CMS. Thẻ dạng infographic: số thứ tự, nhãn mục tiêu,
// tên, slogan, mô tả, tối đa 4 tính năng (solution), ảnh cover khi CMS có,
// dòng kết là link chi tiết. data-product trên mỗi thẻ (FE 32).
// Đọc Strapi ở mỗi request qua await connection() (Next 16 + cacheComponents).
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

// Route chặn (blocking): dữ liệu CMS đọc ở mỗi request, không prerender.
export const instant = false;
import CmsImage from "@/components/CmsImage";
import { PRODUCT_THEME } from "@/lib/product-theme";
import { Breadcrumb } from "@/components/ui";
import { fetchProducts } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({
    locale: loc,
    path: "/products",
    title: loc === "en" ? "Products — AWING" : "Sản phẩm — AWING",
    description: translate(loc, "prod.listSubtitle"),
  });
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection(); // Dừng prerender — đọc Strapi ở mỗi request.
  const products = await fetchProducts(loc);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
            { label: translate(loc, "prod.listTitle") },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl font-black text-ink sm:text-5xl">
          {translate(loc, "prod.listTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">{translate(loc, "prod.listSubtitle")}</p>
      </div>
      {products.length === 0 ? (
        <p className="mx-auto max-w-7xl px-4 py-12 text-sm text-muted sm:px-6">
          {translate(loc, "home.emptyProducts")}
        </p>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
          {products.map((p, i) => {
            const theme = PRODUCT_THEME[p.color];
            return (
              <article
                key={p.slug}
                data-product={p.slug}
                className="overflow-hidden rounded-2xl border border-border bg-white"
              >
                <div className={`h-1.5 ${theme.bar}`} aria-hidden="true" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badge}`}>
                      {p.goal}
                    </span>
                    <span className="font-display text-2xl font-black text-line" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-ink">{p.name}</h2>
                  <p className="mt-1 text-sm font-medium text-muted">{p.tagline}</p>
                  {p.description && <p className="mt-2 text-sm leading-6 text-muted">{p.description}</p>}
                  {p.coverUrl && (
                    <CmsImage src={p.coverUrl} alt={p.name} className="mt-4 w-full rounded-xl border border-border" />
                  )}
                  {p.solutions.length > 0 && (
                    <>
                      <p className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
                        {translate(loc, "prod.solutions")}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {p.solutions.slice(0, 4).map((s) => (
                          <li key={s.slug} className="text-sm text-muted">
                            ·{" "}
                            <Link
                              href={withLocale(`/products/${p.slug}/${s.slug}`, loc)}
                              className="text-ink hover:text-brand"
                            >
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <Link
                    href={withLocale(`/products/${p.slug}`, loc)}
                    className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    {translate(loc, "prod.viewDetails")} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
