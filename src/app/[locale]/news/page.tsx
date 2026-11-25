// Danh sách tin tức (R1-4, FE 37): 118 bài, lọc theo chuyên mục qua URL +
// phân trang 12/trang, mới nhất trước. Chuyên mục lấy từ dữ liệu thật.
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import ContentCard from "@/components/content/ContentCard";
import ServerPagination from "@/components/ServerPagination";
import { fetchArticles } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/news", title: `${translate(loc, "news.title")} — AWING`, description: translate(loc, "news.subtitle") });
}

const PAGE_SIZE = 12;

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  const all = await fetchArticles(loc, 200);
  const categories = [...new Set(all.map((a) => a.category).filter((x): x is string => Boolean(x)))].sort();
  const sorted = [...all].sort((a, b) => (b.publishedDate ?? "").localeCompare(a.publishedDate ?? ""));
  const filtered = category ? sorted.filter((a) => a.category === category) : sorted;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hrefFor = (patch: Record<string, string>, nextPage?: number) => {
    const q = new URLSearchParams();
    if (patch.category || (category && !("category" in patch))) q.set("category", patch.category ?? category);
    if (nextPage !== undefined && nextPage > 1) q.set("page", String(nextPage));
    const s = q.toString();
    return withLocale(`/news${s ? `?${s}` : ""}`, loc);
  };

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "news.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "news.title")}</h1>
        <p className="mt-2 text-muted">{translate(loc, "news.subtitle")}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">{translate(loc, "news.filterCategory")}:</span>
          <Link
            href={hrefFor({ category: "" })}
            aria-current={!category ? "true" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!category ? "border-brand bg-brand text-white" : "border-border bg-white text-ink hover:border-brand hover:text-brand"}`}
          >
            {translate(loc, "news.filterAll")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={hrefFor({ category: c })}
              aria-current={category === c ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === c ? "border-brand bg-brand text-white" : "border-border bg-white text-ink hover:border-brand hover:text-brand"}`}
            >
              {c}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="mt-10 text-muted">{translate(loc, "news.empty")}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ContentCard
                key={a.slug}
                typeLabel={a.category ?? translate(loc, "news.title")}
                title={a.title}
                description={a.summary}
                date={formatDate(a.publishedDate, loc)}
                href={withLocale(`/news/${a.slug}`, loc)}
              />
            ))}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <ServerPagination
            page={safePage}
            totalPages={totalPages}
            hrefFor={(p) => hrefFor({}, p)}
            prevLabel={translate(loc, "ui.prevPage")}
            nextLabel={translate(loc, "ui.nextPage")}
            ariaLabel={translate(loc, "ui.pagination")}
          />
        </div>
      </div>
    </main>
  );
}
