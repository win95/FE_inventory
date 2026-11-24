// Home mới (R1-3, FE 22-27) — nội dung từ Strapi, không còn hero prompt
// và heatmap cũ (heatmap + số realtime chuyển sang trang /locations;
// prompt chiến dịch nằm ở /advertisers):
// - FE 22: hero từ Home single + tab 6 sản phẩm (HomeHero).
// - FE 23: 6 thẻ sản phẩm (ProductCard, link sang /products/{slug}).
// - FE 24: ảnh CMS dùng CmsImage (next/image, alt bắt buộc, lazy) ở các
//   khối media/showcase — Home single hiện chưa có ảnh nên khối minh họa
//   chỉ hiện khi CMS có ảnh cover (trang Product / case study).
// - FE 25: dải snapshot từ DataSnapshot single (không dùng SSE realtime);
//   tầng dữ liệu tách riêng ở lib/strapi.ts để R2 thay bằng Data API.
// - FE 26: showcase mới nhất (News/Resources/Events, server).
// - FE 27: CTA cuối trang mở dialog lead với source (HomeCtaBand).
// Trang đọc Strapi mới nhất ở mỗi request: await connection() (Next 16 +
// cacheComponents — thay cho export const dynamic đã bị cấm) dừng
// prerender tại đó; revalidate qua webhook vẫn áp dụng cho tầng fetch khi
// trang chuyển sang static ở R2.
import { connection } from "next/server";

// Route chặn (blocking): dữ liệu CMS đọc ở mỗi request, không prerender.
export const instant = false;
import HomeCtaBand from "@/components/HomeCtaBand";
import HomeHero from "@/components/HomeHero";
import HowItWorks from "@/components/HowItWorks";
import LeadForm from "@/components/LeadForm";
import Reveal from "@/components/motion/Reveal";
import { ContentCard, ProductCard, StatsCard } from "@/components/content";
import { fetchArticles, fetchDataSnapshot, fetchEvents, fetchHome, fetchProducts, fetchResources } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";

function byDateDesc(a: { date: string | null }, b: { date: string | null }) {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection(); // Dừng prerender — đọc Strapi ở mỗi request.
  const [home, products, snapshot, articles, resources, events] = await Promise.all([
    fetchHome(loc),
    fetchProducts(loc),
    fetchDataSnapshot(loc),
    fetchArticles(loc, 200),
    fetchResources(loc, 100),
    fetchEvents(loc, 100),
  ]);

  const showcase = [
    ...articles
      .slice()
      .sort((a, b) => byDateDesc({ date: a.publishedDate }, { date: b.publishedDate }))
      .slice(0, 2)
      .map((a) => ({ kind: translate(loc, "nav.resNews"), title: a.title, summary: a.summary, href: withLocale(`/news/${a.slug}`, loc) })),
    ...resources
      .slice()
      .sort((a, b) => byDateDesc({ date: a.publishedDate }, { date: b.publishedDate }))
      .slice(0, 2)
      .map((r) => ({ kind: translate(loc, "home.showcaseResource"), title: r.title, summary: r.summary, href: withLocale(`/resources/${r.slug}`, loc) })),
    ...events
      .slice()
      .sort((a, b) => byDateDesc({ date: a.startDate }, { date: b.startDate }))
      .slice(0, 2)
      .map((e) => ({ kind: translate(loc, "nav.resEvents"), title: e.title, summary: e.summary, href: withLocale(`/events/${e.slug}`, loc) })),
  ];

  const numberFmt = new Intl.NumberFormat(loc === "vi" ? "vi-VN" : "en-US");

  return (
    <main>
      <HomeHero
        heroTitle={home?.heroTitle ?? "AWING"}
        heroSubtitle={home?.heroSubtitle ?? ""}
        products={products}
      />
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-label={translate(loc, "home.productsTitle")}>
          <h2 className="font-display text-3xl font-black text-ink">{translate(loc, "home.productsTitle")}</h2>
          <p className="mt-2 max-w-2xl text-base text-muted">{translate(loc, "home.productsSubtitle")}</p>
          {products.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{translate(loc, "home.emptyProducts")}</p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard
                  key={p.slug}
                  name={p.name}
                  tagline={p.tagline}
                  goal={p.goal}
                  color={p.color}
                  solutions={p.solutions.slice(0, 4).map((s) => s.name)}
                  href={withLocale(`/products/${p.slug}`, loc)}
                />
              ))}
            </div>
          )}
        </section>
      </Reveal>
      <Reveal>
        <HowItWorks
          steps={(home?.howItWorks ?? []).map((s) => ({ title: s.stepTitle, description: s.stepText }))}
        />
      </Reveal>
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-label={translate(loc, "home.snapshotTitle")}>
          <h2 className="font-display text-3xl font-black text-ink">{translate(loc, "home.snapshotTitle")}</h2>
          {snapshot?.snapshotDate && (
            <p className="mt-2 text-sm text-muted">
              {translate(loc, "home.snapshotUpdated", { date: snapshot.snapshotDate })}
              {snapshot.note ? ` — ${snapshot.note}` : ""}
            </p>
          )}
          {!snapshot || snapshot.metrics.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{translate(loc, "home.emptySnapshot")}</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.metrics.map((m) => (
                <StatsCard
                  key={m.id}
                  label={m.label}
                  value={numberFmt.format(m.value)}
                  trend={
                    m.trend && m.trend.startsWith("+")
                      ? { text: m.trend, direction: "up", good: true }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
      </Reveal>
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-label={translate(loc, "home.showcaseTitle")}>
          <h2 className="font-display text-3xl font-black text-ink">{translate(loc, "home.showcaseTitle")}</h2>
          {showcase.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{translate(loc, "home.emptyShowcase")}</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {showcase.map((item) => (
                <ContentCard key={item.href} typeLabel={item.kind} title={item.title} description={item.summary} href={item.href} />
              ))}
            </div>
          )}
        </section>
      </Reveal>
      <HomeCtaBand />
      <LeadForm source="home" />
    </main>
  );
}
