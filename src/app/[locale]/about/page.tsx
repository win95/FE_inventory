// Về chúng tôi (R1-4, FE 38): định vị (từ Home single) + số liệu
// (DataSnapshot) + văn phòng (thông tin liên hệ thật, đã kiểm tra trên
// awing.vn 18/11) + CTA. Timeline và đội ngũ CHƯA có dữ liệu CMS (Strapi
// không có loại About) nên chỉ hiện ghi chú chờ cập nhật — không bịa tên
// người hay cột mốc (ghi chú ở SETUP §6.16).
import type { Metadata } from "next";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import ContactInfo from "@/components/ContactInfo";
import StatsCard from "@/components/content/StatsCard";
import LeadButton from "@/components/LeadButton";
import { fetchDataSnapshot, fetchHome } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/about", title: `${translate(loc, "about.title")} — AWING`, description: translate(loc, "about.subtitle") });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const [home, snapshot] = await Promise.all([fetchHome(loc), fetchDataSnapshot(loc)]);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "about.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "about.title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{translate(loc, "about.subtitle")}</p>

        <section className="mt-10 max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "about.positioningTitle")}</h2>
          {home && (
            <>
              <p className="mt-3 text-lg font-semibold leading-8 text-ink">{home.heroTitle}</p>
              <p className="mt-2 leading-7 text-muted">{home.heroSubtitle}</p>
            </>
          )}
        </section>

        {snapshot && snapshot.metrics.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "about.statsTitle")}</h2>
            {snapshot.snapshotDate && (
              <p className="mt-1 text-sm text-muted">{formatDate(snapshot.snapshotDate, loc)}</p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.metrics.map((m) => (
                <StatsCard key={m.id} label={m.label} value={new Intl.NumberFormat(loc === "vi" ? "vi-VN" : "en-US").format(m.value)} trend={m.trend && m.trend.startsWith("+") ? { text: m.trend, direction: "up", good: true } : undefined} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "about.timelineTitle")}</h2>
          <p className="mt-3 text-sm text-muted">{translate(loc, "about.timelineEmpty")}</p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "about.teamTitle")}</h2>
          <p className="mt-3 text-sm text-muted">{translate(loc, "about.teamEmpty")}</p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "about.officesTitle")}</h2>
          <div className="mt-4 max-w-2xl">
            <ContactInfo />
          </div>
        </section>

        <div className="mt-12 rounded-2xl bg-brand px-6 py-10 text-center">
          <h2 className="font-display text-2xl font-black text-white">{translate(loc, "home.ctaTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">{translate(loc, "home.ctaBody")}</p>
          <div className="mt-6">
            <LeadButton source="about-cta" variant="light" size="lg">
              {translate(loc, "nav.getData")}
            </LeadButton>
          </div>
        </div>
      </div>
    </main>
  );
}
