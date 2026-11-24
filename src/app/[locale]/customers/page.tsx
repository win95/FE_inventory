// Khách hàng (R1-4, FE 40): logo wall (tên khách hàng dạng huy hiệu — seed
// R1 chưa có file logo thật) + testimonial + link tới case study (khi có).
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import { fetchCustomers } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/customers", title: `${translate(loc, "customers.title")} — AWING`, description: translate(loc, "customers.subtitle") });
}

export default async function CustomersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const all = await fetchCustomers(loc);
  const shown = all.filter((c) => c.consent);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "customers.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "customers.title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{translate(loc, "customers.subtitle")}</p>

        {shown.length === 0 ? (
          <p className="mt-10 text-muted">{translate(loc, "customers.empty")}</p>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-3">
              {shown.map((c) => (
                <span key={c.slug} className="rounded-xl border border-border bg-white px-5 py-3 font-display text-lg font-bold text-ink">
                  {c.name}
                </span>
              ))}
            </div>
            <section className="mt-12">
              <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "customers.testimonialsTitle")}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {shown.map((c) => (
                  <figure key={c.slug} className="rounded-2xl border border-border bg-white p-6">
                    <blockquote className="text-base leading-7 text-ink">“{c.testimonial}”</blockquote>
                    <figcaption className="mt-4 text-sm">
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className="text-muted"> · {c.industry}</span>
                    </figcaption>
                    {c.caseStudy && c.caseStudy.slug && (
                      <Link href={withLocale(`/case-studies/${c.caseStudy.slug}`, loc)} className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
                        {translate(loc, "customers.caseStudyLink")}: {c.caseStudy.title} →
                      </Link>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
