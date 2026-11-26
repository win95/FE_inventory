// Trang catalogue định dạng quảng cáo (R1-3, FE 31) — dữ liệu từ Strapi.
import type { Metadata } from "next";

import AdFormatCatalog from "@/components/AdFormatCatalog";
import { Breadcrumb } from "@/components/ui";
import { fetchAdFormats } from "@/lib/strapi";
import { translate, withLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({
    locale: loc,
    path: "/ad-formats",
    title: loc === "en" ? "Ad formats — AWING" : "Định dạng quảng cáo — AWING",
    description: translate(loc, "adfmt.subtitle"),
  });
}

export default async function AdFormatsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const formats = await fetchAdFormats(loc, "force-cache");

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
            { label: translate(loc, "adfmt.title") },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl font-black text-ink sm:text-5xl">
          {translate(loc, "adfmt.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">{translate(loc, "adfmt.subtitle")}</p>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <AdFormatCatalog formats={formats} />
      </div>
    </main>
  );
}
