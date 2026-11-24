// Câu hỏi thường gặp (R1-4, FE 44): accordion nhóm theo chuyên mục +
// schema FAQPage. 12 câu seed: Wi-Fi / Quảng cáo / Dữ liệu.
import type { Metadata } from "next";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import FaqAccordion from "@/components/FaqAccordion";
import { fetchFaqs } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/faq", title: `${translate(loc, "faq.title")} — AWING`, description: translate(loc, "faq.subtitle") });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const all = await fetchFaqs(loc);
  const categories = [...new Set(all.map((f) => f.category).filter(Boolean))];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: all.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer.split(/\n\s*\n/)[0] ?? "" },
            })),
          }),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(loc, "footer.home"), href: withLocale("/", loc) }, { label: translate(loc, "faq.title") }]} />
        <h1 className="mt-4 font-display text-3xl font-black text-ink sm:text-4xl">{translate(loc, "faq.title")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{translate(loc, "faq.subtitle")}</p>

        {all.length === 0 ? (
          <p className="mt-10 text-muted">{translate(loc, "faq.empty")}</p>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl space-y-10">
            {categories.map((cat) => (
              <section key={cat}>
                <h2 className="mb-4 font-display text-xl font-bold text-ink">{cat}</h2>
                <FaqAccordion items={all.filter((f) => f.category === cat)} />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
