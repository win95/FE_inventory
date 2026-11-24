// Nhà đầu tư (R1-4, FE 41): định vị + số liệu công khai (DataSnapshot) +
// liên hệ. Không công bố doanh thu hay tên khách hàng kèm doanh thu
// (quy tắc D-08).
import type { Metadata } from "next";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import StatsCard from "@/components/content/StatsCard";
import { fetchDataSnapshot, fetchHome } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/investors", title: `${translate(loc, "investors.title")} — AWING`, description: translate(loc, "investors.subtitle") });
}

export default async function InvestorsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const [home, snapshot] = await Promise.all([fetchHome(loc), fetchDataSnapshot(loc)]);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "investors.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "investors.title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{translate(loc, "investors.subtitle")}</p>

        {home && (
          <section className="mt-10 max-w-3xl">
            <p className="text-lg font-semibold leading-8 text-ink">{home.heroTitle}</p>
            <p className="mt-2 leading-7 text-muted">{home.heroSubtitle}</p>
          </section>
        )}

        {snapshot && snapshot.metrics.length > 0 && (
          <section className="mt-12">
            {snapshot.snapshotDate && <p className="text-sm text-muted">{formatDate(snapshot.snapshotDate, loc)}</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.metrics.map((m) => (
                <StatsCard key={m.id} label={m.label} value={new Intl.NumberFormat(loc === "vi" ? "vi-VN" : "en-US").format(m.value)} trend={m.trend && m.trend.startsWith("+") ? { text: m.trend, direction: "up", good: true } : undefined} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-bold text-ink">{translate(loc, "investors.contactTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{translate(loc, "investors.contactBody")}</p>
          <a href="mailto:contact@awing.vn" className="mt-3 inline-block font-medium text-brand hover:underline">
            contact@awing.vn
          </a>
        </section>
      </div>
    </main>
  );
}
