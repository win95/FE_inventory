// Danh sách sự kiện (R1-4, FE 35): tab Sắp diễn ra / Đã diễn ra (theo ngày
// bắt đầu so với hôm nay) + lọc hình thức qua URL. 6 sự kiện seed: 3 sắp
// diễn ra (12/2026, 02/2027), 3 đã diễn ra (11/2026, 09/2026, 06/2025).
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import ContentCard from "@/components/content/ContentCard";
import { fetchEvents } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate, nowMs } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/events", title: `${translate(loc, "events.title")} — AWING`, description: translate(loc, "events.subtitle") });
}

const MODE_LABEL: Record<string, DictKey> = { online: "events.modeOnline", offline: "events.modeOffline", hybrid: "events.modeHybrid" };

export default async function EventsPage({
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
  const tab = typeof sp.tab === "string" && sp.tab === "past" ? "past" : "upcoming";
  const mode = typeof sp.mode === "string" ? sp.mode : "";

  const all = await fetchEvents(loc);
  const now = nowMs();
  const filtered = all
    .filter((e) => {
      const start = e.startDate ? new Date(e.startDate).getTime() : 0;
      return tab === "upcoming" ? start >= now : start < now;
    })
    .filter((e) => !mode || e.mode === mode)
    .sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      return tab === "upcoming" ? da - db : db - da;
    });

  const hrefFor = (patch: Record<string, string>) => {
    const q = new URLSearchParams({ tab, ...(mode ? { mode } : {}), ...patch });
    for (const [k, v] of Object.entries(patch)) if (!v) q.delete(k);
    const s = q.toString();
    return withLocale(`/events${s ? `?${s}` : ""}`, loc);
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
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "events.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "events.title")}</h1>
        <p className="mt-2 text-muted">{translate(loc, "events.subtitle")}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {chip(translate(loc, "events.tabUpcoming"), hrefFor({ tab: "upcoming" }), tab === "upcoming")}
          {chip(translate(loc, "events.tabPast"), hrefFor({ tab: "past" }), tab === "past")}
          <span className="mx-2 text-border">|</span>
          <span className="text-xs font-semibold text-muted">{translate(loc, "events.filterMode")}:</span>
          {chip(translate(loc, "res.filterAll"), hrefFor({ mode: "" }), !mode)}
          {Object.entries(MODE_LABEL).map(([v, k]) => chip(translate(loc, k), hrefFor({ mode: v }), mode === v))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-muted">{translate(loc, "events.empty")}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <ContentCard
                key={e.slug}
                typeLabel={[translate(loc, MODE_LABEL[e.mode ?? ""] ?? "events.modeOffline"), e.location].filter(Boolean).join(" · ")}
                title={e.title}
                description={e.summary}
                date={formatDate(e.startDate, loc)}
                href={withLocale(`/events/${e.slug}`, loc)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
