// Chi tiết tin tức (R1-4, FE 37): mẫu T.Article + schema NewsArticle +
// tin liên quan cùng chuyên mục.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ArticleTemplate from "@/components/ArticleTemplate";
import ContentCard from "@/components/content/ContentCard";
import { fetchArticleBySlug, fetchArticles } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { localizedUrl, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchArticleBySlug(loc, slug).catch(() => null);
  if (!item) return pageMetadata({ locale: loc, path: `/news/${slug}`, title: "AWING", description: "" });
  return pageMetadata({ locale: loc, path: `/news/${slug}`, title: `${item.title} — AWING`, description: item.summary });
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const item = await fetchArticleBySlug(loc, slug);
  if (!item) notFound();

  const related = (await fetchArticles(loc, 200))
    .filter((a) => a.slug !== slug && a.category === item.category)
    .sort((a, b) => (b.publishedDate ?? "").localeCompare(a.publishedDate ?? ""))
    .slice(0, 3);

  return (
    <ArticleTemplate
      locale={loc}
      eyebrow={item.category ?? translate(loc, "news.title")}
      title={item.title}
      meta={formatDate(item.publishedDate, loc) || null}
      shareUrl={localizedUrl(loc, `/news/${slug}`)}
      content={item.content}
      breadcrumb={[
        { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
        { label: translate(loc, "news.title"), href: withLocale("/news", loc) },
        { label: item.title },
      ]}
      backHref="/news"
      backLabel={translate(loc, "news.backToList")}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: item.title,
        description: item.summary,
        datePublished: item.publishedDate ?? undefined,
        author: { "@type": "Organization", name: "AWING" },
        publisher: { "@type": "Organization", name: "AWING" },
      }}
      relatedTitle={related.length > 0 ? translate(loc, "news.relatedTitle") : undefined}
    >
      {related.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((a) => (
            <ContentCard key={a.slug} typeLabel={a.category ?? translate(loc, "news.title")} title={a.title} description={a.summary} date={formatDate(a.publishedDate, loc)} href={withLocale(`/news/${a.slug}`, loc)} />
          ))}
        </div>
      )}
    </ArticleTemplate>
  );
}
