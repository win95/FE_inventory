// Chi tiết case study (R1-4, FE 34): mẫu T.Article + schema Article.
// Link tới đây từ trang Customers và từ khối case study ở trang solution.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleTemplate from "@/components/ArticleTemplate";
import ContentCard from "@/components/content/ContentCard";
import { fetchCaseStudies, fetchCaseStudyBySlug } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { localizedUrl, pageMetadata } from "@/lib/seo";


export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchCaseStudyBySlug(loc, slug, "force-cache").catch(() => null);
  if (!item) return pageMetadata({ locale: loc, path: `/case-studies/${slug}`, title: "AWING", description: "" });
  return pageMetadata({ locale: loc, path: `/case-studies/${slug}`, title: `${item.title} — AWING`, description: item.summary ?? "" });
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchCaseStudyBySlug(loc, slug, "force-cache");
  if (!item) notFound();

  const related = (await fetchCaseStudies(loc, "force-cache")).filter((c) => c.slug !== slug).slice(0, 3);

  return (
    <ArticleTemplate
      locale={loc}
      eyebrow={translate(loc, "res.typeCaseStudy")}
      title={item.title}
      meta={[item.industry, item.metricLabel && item.metricValue !== null ? `${item.metricLabel}: ${item.metricValue}` : null].filter(Boolean).join(" · ") || null}
      shareUrl={localizedUrl(loc, `/case-studies/${slug}`)}
      content={item.summary ?? ""}
      breadcrumb={[
        { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
        { label: translate(loc, "customers.title"), href: withLocale("/customers", loc) },
        { label: item.title },
      ]}
      backHref="/customers"
      backLabel={translate(loc, "customers.title")}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: item.title,
        description: item.summary ?? "",
        author: { "@type": "Organization", name: "AWING" },
        publisher: { "@type": "Organization", name: "AWING" },
      }}
      relatedTitle={related.length > 0 ? translate(loc, "res.relatedTitle") : undefined}
    >
      {related.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((c) => (
            <ContentCard
              key={c.slug}
              typeLabel={translate(loc, "res.typeCaseStudy")}
              title={c.title}
              description={c.summary}
              href={withLocale(`/case-studies/${c.slug}`, loc)}
            />
          ))}
        </div>
      )}
    </ArticleTemplate>
  );
}
