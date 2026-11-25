// Hub tài nguyên (R1-4, FE 33): lưới thẻ + lọc theo loại/ngành/năm qua URL
// + phân trang. Ngành và năm lấy từ dữ liệu thật (industry backfill R1-4,
// năm từ publishedDate). Không có trường product trên Resource nên bộ lọc
// theo sản phẩm chưa làm được — cần thêm relation product ở CMS (ghi chú
// ở SETUP §6.16).
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import ContentCard from "@/components/content/ContentCard";
import ServerPagination from "@/components/ServerPagination";
import { fetchResources } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/resources", title: `${translate(loc, "res.title")} — AWING`, description: translate(loc, "res.subtitle") });
}

const PAGE_SIZE = 6;

const TYPE_LABEL: Record<string, DictKey> = { report: "res.typeReport", paper: "res.typePaper", "case-study": "res.typeCaseStudy" };

export default async function ResourcesPage({
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
  const type = typeof sp.type === "string" ? sp.type : "";
  const industry = typeof sp.industry === "string" ? sp.industry : "";
  const year = typeof sp.year === "string" ? sp.year : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  // Danh sách sắp xếp theo ngày đăng mới nhất (sort phía Strapi).
  const all = await fetchResources(loc, 100, "publishedDate:desc");
  const industries = [...new Set(all.map((r) => r.industry).filter((x): x is string => Boolean(x)))].sort();
  const years = [...new Set(all.map((r) => (r.publishedDate ?? "").slice(0, 4)).filter(Boolean))].sort().reverse();

  const filtered = all.filter(
    (r) =>
      (!type || r.type === type) &&
      (!industry || r.industry === industry) &&
      (!year || (r.publishedDate ?? "").startsWith(year)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hrefFor = (patch: Record<string, string | undefined>, nextPage?: number) => {
    const q = new URLSearchParams();
    const next = { type, industry, year, ...(patch as Record<string, string>) };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    if (nextPage !== undefined && nextPage > 1) q.set("page", String(nextPage));
    const s = q.toString();
    return withLocale(`/resources${s ? `?${s}` : ""}`, loc);
  };

  const chip = (label: string, href: string, active: boolean) => (
    <Link
      key={label + href}
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
        active ? "border-brand bg-brand text-white" : "border-border bg-white text-ink hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "res.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "res.title")}</h1>
        <p className="mt-2 text-muted">{translate(loc, "res.subtitle")}</p>

        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">{translate(loc, "res.filterType")}:</span>
            {chip(translate(loc, "res.filterAll"), hrefFor({ type: "" }), !type)}
            {Object.entries(TYPE_LABEL).map(([v, k]) => chip(translate(loc, k), hrefFor({ type: v }), type === v))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">{translate(loc, "res.filterIndustry")}:</span>
            {chip(translate(loc, "res.filterAll"), hrefFor({ industry: "" }), !industry)}
            {industries.map((v) => chip(v, hrefFor({ industry: v }), industry === v))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">{translate(loc, "res.filterYear")}:</span>
            {chip(translate(loc, "res.filterAll"), hrefFor({ year: "" }), !year)}
            {years.map((v) => chip(v, hrefFor({ year: v }), year === v))}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="mt-10 text-muted">{translate(loc, "res.empty")}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <ContentCard
                key={r.slug}
                typeLabel={translate(loc, TYPE_LABEL[r.type] ?? "res.typeReport")}
                title={r.title}
                description={r.summary}
                date={formatDate(r.publishedDate, loc)}
                href={withLocale(`/resources/${r.slug}`, loc)}
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
