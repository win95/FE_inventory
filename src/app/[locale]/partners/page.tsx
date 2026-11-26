// Đối tác (R1-4, FE 39): nhóm theo venue / chiến lược / nhà đầu tư.
// CHỈ hiển thị đối tác có consent=true — đối tác consent=false (seed cố
// tình để 1) không xuất hiện và không được link tới.
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui";
import { fetchPartners } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";


export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/partners", title: `${translate(loc, "partners.title")} — AWING`, description: translate(loc, "partners.subtitle") });
}

const GROUPS: { category: string; key: DictKey }[] = [
  { category: "venue", key: "partners.groupVenue" },
  { category: "strategic", key: "partners.groupStrategic" },
  { category: "investor", key: "partners.groupInvestor" },
];

export default async function PartnersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const all = await fetchPartners(loc, "force-cache");
  const shown = all.filter((p) => p.consent);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "partners.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "partners.title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{translate(loc, "partners.subtitle")}</p>

        {GROUPS.map((g) => {
          const items = shown.filter((p) => p.category === g.category);
          return (
            <section key={g.category} className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, g.key)}</h2>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{translate(loc, "partners.empty")}</p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <div key={p.slug} className="rounded-2xl border border-border bg-white p-5">
                      <p className="font-display text-lg font-bold text-ink">{p.name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{p.description}</p>
                      {p.website && (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
                          {translate(loc, "partners.visitSite")} →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
