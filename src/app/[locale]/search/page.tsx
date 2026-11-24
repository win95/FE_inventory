// Trang kết quả tìm kiếm (FE 46-47, R1-5): query + tab + ngôn ngữ trong URL,
// tab có số đếm từ facet của BE, phân trang phía server. Nguồn là
// GET /api/search của FastAPI (BE 18-20). Tab "Data" chưa có — BE chưa
// index nội dung dữ liệu (mạng lưới/bản đồ nhiệt), chỉ có 6 loại dưới đây;
// thêm tab khi R2 có index dữ liệu, không hiện tab luôn bằng 0.
import { connection } from "next/server";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui";
import ContentCard from "@/components/content/ContentCard";
import ServerPagination from "@/components/ServerPagination";
import { searchContent, type SearchResponse } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const instant = false;

const PAGE_SIZE = 12;

const TABS = [
  { id: "all", type: undefined, countKey: null },
  { id: "products", type: "products,solutions", countKey: "products" },
  { id: "resources", type: "resources", countKey: "resources" },
  { id: "events", type: "events", countKey: "events" },
  { id: "news", type: "news", countKey: "news" },
  { id: "careers", type: "jobs", countKey: "jobs" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_LABELS: Record<TabId, DictKey> = {
  all: "search.tabAll",
  products: "search.typeProducts",
  resources: "search.typeResources",
  events: "search.typeEvents",
  news: "search.typeNews",
  careers: "search.typeJobs",
};

const TYPE_LABELS: Record<string, DictKey> = {
  products: "search.typeProducts",
  solutions: "search.typeSolutions",
  resources: "search.typeResources",
  events: "search.typeEvents",
  news: "search.typeNews",
  jobs: "search.typeJobs",
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const title =
    q === ""
      ? loc === "en"
        ? "Search — AWING"
        : "Tìm kiếm — AWING"
      : loc === "en"
        ? `“${q}” — Search results — AWING`
        : `“${q}” — Kết quả tìm kiếm — AWING`;
  return pageMetadata({
    locale: loc,
    path: "/search",
    title,
    description:
      loc === "en"
        ? "Search AWING products, resources, events, news and jobs."
        : "Tìm sản phẩm, tài nguyên, sự kiện, tin tức và việc làm của AWING.",
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/[locale]/search">) {
  await connection();
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tab: TabId = TABS.some((tb) => tb.id === sp.tab) ? (sp.tab as TabId) : "all";
  const scope = sp.locale === "all" ? "all" : loc;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  // Hai lần gọi song song: lần không lọc lấy facet + kết quả tab "Tất cả",
  // lần lọc theo tab lấy kết quả của tab đó. BE lỗi → null, trang hiện
  // trạng thái lỗi thay vì crash (xem bên dưới).
  const tabDef = TABS.find((tb) => tb.id === tab) ?? TABS[0];
  const [overview, tabRes]: [SearchResponse | null, SearchResponse | null] =
    q === ""
      ? [null, null]
      : await Promise.all([
          searchContent(q, { locale: scope, page, pageSize: PAGE_SIZE }, loc).catch(() => null),
          tabDef.type === undefined
            ? Promise.resolve(null)
            : searchContent(q, { locale: scope, type: tabDef.type, page, pageSize: PAGE_SIZE }, loc).catch(() => null),
        ]);

  const data = tab === "all" ? overview : tabRes;
  const facets = overview?.facets ?? {};
  const countFor = (tb: (typeof TABS)[number]): number => {
    if (tb.id === "all") return overview?.total ?? 0;
    if (tb.id === "products") return (facets.products ?? 0) + (facets.solutions ?? 0);
    return facets[tb.countKey as string] ?? 0;
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const hrefFor = (patch: Record<string, string | number | undefined>) => {
    const merged = new URLSearchParams();
    if (q !== "") merged.set("q", q);
    merged.set("tab", tab);
    merged.set("locale", scope);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) merged.delete(k);
      else merged.set(k, String(v));
    }
    return `${withLocale("/search", loc)}?${merged.toString()}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Breadcrumb
        items={[
          { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
          { label: translate(loc, "search.title") },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {loc === "vi" ? "Tìm kiếm" : "Search"}
      </h1>

      <form method="get" action={withLocale("/search", loc)} className="mt-6 flex flex-wrap gap-3">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="search-q" className="sr-only">
          {loc === "vi" ? "Từ khóa tìm kiếm" : "Search keywords"}
        </label>
        <input
          id="search-q"
          name="q"
          type="text"
          defaultValue={q}
          placeholder={loc === "vi" ? "Tìm sản phẩm, dữ liệu, tài nguyên…" : "Search products, data, resources…"}
          className="h-11 min-w-64 flex-1 rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand"
        />
        <label htmlFor="search-locale" className="sr-only">
          {loc === "vi" ? "Ngôn ngữ tìm kiếm" : "Search language"}
        </label>
        <select
          id="search-locale"
          name="locale"
          defaultValue={scope}
          className="h-11 rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand"
        >
          <option value={loc}>{loc === "vi" ? "Tiếng Việt" : "English"}</option>
          <option value="all">{loc === "vi" ? "Tất cả ngôn ngữ" : "All languages"}</option>
        </select>
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark"
        >
          {loc === "vi" ? "Tìm" : "Search"}
        </button>
      </form>

      {q === "" && (
        <p className="mt-8 text-muted">{translate(loc, "searchpage.noQuery")}</p>
      )}

      {q !== "" && overview === null && (
        <p role="alert" className="mt-8 text-brand">
          {translate(loc, "searchpage.unavailable")}
        </p>
      )}

      {q !== "" && overview !== null && (
        <>
          <p className="mt-8 text-sm text-muted">
            {translate(loc, "searchpage.resultsFor", { n: String(overview.total), q })}
          </p>

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={translate(loc, "search.title")}>
            {TABS.map((tb) => (
              <Link
                key={tb.id}
                href={hrefFor({ tab: tb.id, page: 1 })}
                role="tab"
                aria-selected={tab === tb.id}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  tab === tb.id
                    ? "border-brand bg-brand text-white"
                    : "border-border text-muted hover:border-brand hover:text-brand"
                }`}
              >
                {translate(loc, TAB_LABELS[tb.id])} ({countFor(tb)})
              </Link>
            ))}
          </div>

          {data !== null && data.results.length === 0 && (
            <p className="mt-8 text-muted">
              {translate(loc, "searchpage.empty", { q })}
            </p>
          )}

          {data !== null && data.results.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((item) => (
                <ContentCard
                  key={`${item.type}-${item.slug}-${item.locale}`}
                  typeLabel={
                    TYPE_LABELS[item.type] ? translate(loc, TYPE_LABELS[item.type]) : item.type
                  }
                  title={item.title}
                  description={item.summary}
                  date={item.date ? formatDate(item.date, loc) : null}
                  href={withLocale(item.url, item.locale === "vi" || item.locale === "en" ? item.locale : loc)}
                />
              ))}
            </div>
          )}

          {data !== null && (
            <div className="mt-8 flex justify-center">
              <ServerPagination
                page={page}
                totalPages={totalPages}
                hrefFor={(p) => hrefFor({ page: p })}
                prevLabel={loc === "vi" ? "Trước" : "Previous"}
                nextLabel={loc === "vi" ? "Sau" : "Next"}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
