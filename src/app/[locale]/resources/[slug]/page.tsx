// Chi tiết tài nguyên (R1-4, FE 34): mẫu T.Article + schema Article.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ArticleTemplate from "@/components/ArticleTemplate";
import ContentCard from "@/components/content/ContentCard";
import { fetchResourceBySlug, fetchResources } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { localizedUrl, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchResourceBySlug(loc, slug).catch(() => null);
  if (!item) return pageMetadata({ locale: loc, path: `/resources/${slug}`, title: "AWING", description: "" });
  return pageMetadata({ locale: loc, path: `/resources/${slug}`, title: `${item.title} — AWING`, description: item.summary });
}

const TYPE_LABEL: Record<string, DictKey> = { report: "res.typeReport", paper: "res.typePaper", "case-study": "res.typeCaseStudy" };

export default async function ResourceDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const item = await fetchResourceBySlug(loc, slug);
  if (!item) notFound();

  const related = (await fetchResources(loc)).filter((r) => r.slug !== slug && r.type === item.type).slice(0, 3);
  const meta = [formatDate(item.publishedDate, loc), item.industry].filter(Boolean).join(" · ");
  const typeLabel = translate(loc, TYPE_LABEL[item.type] ?? "res.typeReport");

  return (
    <ArticleTemplate
      locale={loc}
      eyebrow={typeLabel}
      title={item.title}
      meta={meta || null}
      shareUrl={localizedUrl(loc, `/resources/${slug}`)}
      content={item.content || item.summary}
      breadcrumb={[
        { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
        { label: translate(loc, "res.title"), href: withLocale("/resources", loc) },
        { label: item.title },
      ]}
      backHref="/resources"
      backLabel={translate(loc, "res.backToList")}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: item.title,
        description: item.summary,
        datePublished: item.publishedDate ?? undefined,
        author: { "@type": "Organization", name: "AWING" },
        publisher: { "@type": "Organization", name: "AWING" },
      }}
      relatedTitle={related.length > 0 ? translate(loc, "res.relatedTitle") : undefined}
    >
      {related.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <ContentCard key={r.slug} typeLabel={typeLabel} title={r.title} description={r.summary} date={formatDate(r.publishedDate, loc)} href={withLocale(`/resources/${r.slug}`, loc)} />
          ))}
        </div>
      )}
    </ArticleTemplate>
  );
}
