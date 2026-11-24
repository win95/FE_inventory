import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import LocaleProvider from "@/components/LocaleProvider";
import SiteChrome from "@/components/SiteChrome";
import { ToastViewport } from "@/components/ui";
import { LOCALES, type Locale } from "@/lib/i18n";
import {
  organizationJsonLd,
  pageMetadata,
  websiteJsonLd,
} from "@/lib/seo";
import { fetchGlobal } from "@/lib/strapi";

// Layout cho mọi trang theo locale (/vi, /en — Docs §4.2, FE 4).
// Locale không hợp lệ → 404 (middleware đã chuyển đường dẫn không tiền tố
// về /vi, đây chỉ là chốt chặn cuối). Metadata theo locale: canonical tự
// trỏ + hreflang vi/en/x-default + Open Graph (FE 6); JSON-LD Organization
// + WebSite gắn trong body (SearchAction thêm ở R1-5 khi /search có thật).

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({
    locale: loc,
    path: "/",
    title:
      loc === "en"
        ? "AWING — Connecting Brands with Real-World Consumer Moments"
        : "AWING — Kết nối thương hiệu với khoảnh khắc đời thực",
    description:
      loc === "en"
        ? "AWING connects brands with real-world consumer moments across Vietnam — location-based channel, retail media, measurement, insights, network and ads manager."
        : "AWING kết nối thương hiệu với khoảnh khắc đời thực của người tiêu dùng trên khắp Việt Nam — kênh theo vị trí, retail media, đo lường, insights, network và ads manager.",
  });
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (locale !== "vi" && locale !== "en") notFound();
  // Link mạng xã hội (FE 48) lấy từ single Global — Strapi lỗi thì footer
  // giữ nút mờ, layout không crash.
  const global = await fetchGlobal(locale as Locale).catch(() => null);
  return (
    <LocaleProvider locale={locale as Locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
        }}
      />
      <SiteChrome>{children}</SiteChrome>
      <Footer socials={global?.socialLinks ?? []} />
      <ToastViewport />
    </LocaleProvider>
  );
}
