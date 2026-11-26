// Trang chi tiết sản phẩm (R1-3, FE 29): Hero + Opportunity + Solutions +
// How to plan + Showcase + Lead form — tất cả từ dynamic-zone blocks của
// Strapi (trừ block hero: trang tự render hero từ trường sản phẩm để
// tránh lặp tiêu đề). Breadcrumb + BreadcrumbList schema. data-product
// trên main (FE 32); CTA dùng màu sản phẩm (badge -on đạt WCAG AA).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import CmsImage from "@/components/CmsImage";
import LeadButton from "@/components/LeadButton";
import { PRODUCT_THEME } from "@/lib/product-theme";
import { Breadcrumb } from "@/components/ui";
import { applyBlockTitles, fetchProductBySlug } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";

import { breadcrumbJsonLd, localizedUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; product: string }>;
}): Promise<Metadata> {
  const { locale, product: slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const product = await fetchProductBySlug(loc, slug, "force-cache").catch(() => null);
  if (!product) return pageMetadata({ locale: loc, path: `/products/${slug}`, title: "AWING", description: "" });
  return pageMetadata({
    locale: loc,
    path: `/products/${slug}`,
    title: `${product.name} — AWING`,
    description: product.tagline || product.description,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; product: string }>;
}) {
  const { locale, product: slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const product = await fetchProductBySlug(loc, slug, "force-cache");
  if (!product) notFound();

  const theme = PRODUCT_THEME[product.color];
  const blocks = applyBlockTitles(
    product.blocks.filter((b) => b.type !== "hero"),
    {
      opportunity: translate(loc, "prod.opportunity"),
      solutions: translate(loc, "prod.solutionsTitle", { product: product.name }),
      howToPlan: translate(loc, "prod.howToPlan"),
      showcase: translate(loc, "prod.showcase"),
    },
  );

  return (
    <main data-product={product.slug}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "AWING", url: localizedUrl(loc, "/") },
              { name: translate(loc, "prod.listTitle"), url: localizedUrl(loc, "/products") },
              { name: product.name, url: localizedUrl(loc, `/products/${product.slug}`) },
            ]),
          ),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
            { label: translate(loc, "prod.listTitle"), href: withLocale("/products", loc) },
            { label: product.name },
          ]}
        />
      </div>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className={`h-1.5 rounded-full ${theme.bar}`} aria-hidden="true" />
        <p className={`mt-6 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badge}`}>
          {product.name}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] font-black text-ink sm:text-5xl">
          {product.tagline}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">{product.goal}</p>
        {product.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{product.description}</p>}
        {product.coverUrl && (
          <CmsImage src={product.coverUrl} alt={product.name} priority className="mt-6 w-full rounded-2xl border border-border" />
        )}
        <div className="mt-6">
          <LeadButton source={`product-${product.slug}`} size="lg">
            {translate(loc, "prod.getDataFor", { product: product.name })}
          </LeadButton>
        </div>
      </section>
      <BlockRenderer blocks={blocks} />
    </main>
  );
}
