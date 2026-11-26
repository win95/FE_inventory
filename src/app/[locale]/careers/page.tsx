// Danh sách tuyển dụng (R1-4, FE 42): lọc phòng ban/địa điểm qua URL,
// vị trí hết hạn (deadline < hôm nay) không hiện.
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui";
import { fetchJobs } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate, todayIso } from "@/lib/format";


export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/careers", title: `${translate(loc, "jobs.title")} — AWING`, description: translate(loc, "jobs.subtitle") });
}

const TYPE_LABEL: Record<string, DictKey> = { "full-time": "jobs.typeFullTime", contract: "jobs.typeContract", internship: "jobs.typeInternship" };

export default async function CareersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const sp = await searchParams;
  const department = typeof sp.department === "string" ? sp.department : "";
  const location = typeof sp.location === "string" ? sp.location : "";

  const all = await fetchJobs(loc, "force-cache");
  const today = todayIso();
  const open = all.filter((j) => !j.deadline || j.deadline >= today);
  const departments = [...new Set(open.map((j) => j.department).filter(Boolean))].sort();
  const locations = [...new Set(open.map((j) => j.location).filter(Boolean))].sort();
  const filtered = open.filter((j) => (!department || j.department === department) && (!location || j.location === location));

  const hrefFor = (patch: Record<string, string>) => {
    const q = new URLSearchParams();
    const next = { department, location, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    const s = q.toString();
    return withLocale(`/careers${s ? `?${s}` : ""}`, loc);
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
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "jobs.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "jobs.title")}</h1>
        <p className="mt-2 text-muted">{translate(loc, "jobs.subtitle")}</p>

        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">{translate(loc, "jobs.filterDepartment")}:</span>
            {chip(translate(loc, "jobs.filterAll"), hrefFor({ department: "" }), !department)}
            {departments.map((v) => chip(v, hrefFor({ department: v }), department === v))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">{translate(loc, "jobs.filterLocation")}:</span>
            {chip(translate(loc, "jobs.filterAll"), hrefFor({ location: "" }), !location)}
            {locations.map((v) => chip(v, hrefFor({ location: v }), location === v))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-muted">{translate(loc, "jobs.empty")}</p>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((j) => (
              <Link key={j.slug} href={withLocale(`/careers/${j.slug}`, loc)} className="block rounded-2xl border border-border bg-white p-5 hover:border-brand">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-ink">{j.title}</h2>
                  <span className="text-xs text-muted">
                    {translate(loc, "jobs.deadlineLabel")}: {formatDate(j.deadline, loc)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {[j.department, j.location, translate(loc, TYPE_LABEL[j.type] ?? "jobs.typeFullTime")].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{j.description.split(/\n\s*\n/)[0]}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
