// Trang chi tiết solution (R1-3, FE 30): hero (tên + tóm tắt + chip sản
// phẩm), nội dung từ blocks của Strapi (rich-text), các solution cùng sản
// phẩm, case study mới nhất. Breadcrumb + BreadcrumbList schema. URL:
// /products/{product}/{solution} (khớp với /api/search của BE).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import LeadButton from "@/components/LeadButton";
import { PRODUCT_THEME } from "@/lib/product-theme";
import { Breadcrumb } from "@/components/ui";
import { fetchCaseStudies, fetchProductBySlug, fetchSolutionBySlug, fetchSolutionsByProduct } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";

import { breadcrumbJsonLd, localizedUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; product: string; solution: string }>;
}): Promise<Metadata> {
  const { locale, product, solution } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const sol = await fetchSolutionBySlug(loc, solution, "force-cache").catch(() => null);
  if (!sol || sol.productSlug !== product) {
    return pageMetadata({ locale: loc, path: `/products/${product}/${solution}`, title: "AWING", description: "" });
  }
  return pageMetadata({
    locale: loc,
    path: `/products/${product}/${solution}`,
    title: `${sol.name} — ${sol.productName} — AWING`,
    description: sol.summary,
  });
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; product: string; solution: string }>;
}) {
  const { locale, product: productSlug, solution: solutionSlug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const sol = await fetchSolutionBySlug(loc, solutionSlug, "force-cache");
  if (!sol || sol.productSlug !== productSlug) notFound();
  const [product, siblings, caseStudies] = await Promise.all([
    fetchProductBySlug(loc, productSlug, "force-cache"),
    fetchSolutionsByProduct(loc, productSlug, "force-cache"),
    fetchCaseStudies(loc, "force-cache"),
  ]);
  const theme = product ? PRODUCT_THEME[product.color] : null;

  return (
    <main data-product={productSlug}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "AWING", url: localizedUrl(loc, "/") },
              { name: translate(loc, "prod.listTitle"), url: localizedUrl(loc, "/products") },
              { name: sol.productName, url: localizedUrl(loc, `/products/${productSlug}`) },
              { name: sol.name, url: localizedUrl(loc, `/products/${productSlug}/${sol.slug}`) },
            ]),
          ),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
            { label: translate(loc, "prod.listTitle"), href: withLocale("/products", loc) },
            { label: sol.productName, href: withLocale(`/products/${productSlug}`, loc) },
            { label: sol.name },
          ]}
        />
      </div>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {theme && <div className={`h-1.5 rounded-full ${theme.bar}`} aria-hidden="true" />}
        <p className="mt-6">
          <Link
            href={withLocale(`/products/${productSlug}`, loc)}
            className="text-sm font-semibold text-brand hover:text-brand-dark"
          >
            ← {sol.productName}
          </Link>
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] font-black text-ink sm:text-5xl">
          {sol.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">{sol.summary}</p>
        <div className="mt-6">
          <LeadButton source={`solution-${sol.slug}`} size="lg">
            {translate(loc, "nav.getData")}
          </LeadButton>
        </div>
      </section>
      <BlockRenderer blocks={sol.blocks} />
      {siblings.filter((s) => s.slug !== sol.slug).length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-black text-ink">
            {translate(loc, "prod.siblings", { product: sol.productName })}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {siblings
              .filter((s) => s.slug !== sol.slug)
              .map((s) => (
                <div key={s.slug} className="rounded-2xl border border-border bg-white p-5">
                  <h3 className="font-bold text-ink">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted">{s.summary}</p>
                  <Link
                    href={withLocale(`/products/${productSlug}/${s.slug}`, loc)}
                    className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    {translate(loc, "prod.viewSolution")}
                  </Link>
                </div>
              ))}
          </div>
        </section>
      )}
      {caseStudies.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-3xl font-black text-ink">
            {translate(loc, "prod.relatedCaseStudies")}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {caseStudies.slice(0, 3).map((cs) => (
              <Link
                key={cs.title}
                href={withLocale(`/case-studies/${cs.slug}`, loc)}
                className="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-brand"
              >
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {translate(loc, "adv.studiesTitle")}
                </p>
                <h3 className="mt-2 font-bold text-ink">{cs.title}</h3>
                {cs.summary && <p className="mt-1 text-sm text-muted">{cs.summary}</p>}
                {cs.metricValue !== null && (
                  <p className="mt-2 text-sm text-muted">
                    {cs.metricLabel}: <strong className="text-ink">{cs.metricValue}</strong>
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
