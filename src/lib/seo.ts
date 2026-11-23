// SEO framework (FE 6) — canonical / hreflang / sitemap / JSON-LD dùng chung.
//
// - Domain lấy từ NEXT_PUBLIC_SITE_URL (mặc định https://awing.vn — FIX-01:
//   sitemap/robots/canonical phải trỏ domain thật, không trỏ staging).
// - Mọi trang locale đều dùng pageMetadata(): canonical tự trỏ (FIX-02),
//   hreflang vi + en + x-default (FIX-03/04), Open Graph + Twitter.
// - JSON-LD: Organization + WebSite gắn ở [locale]/layout.tsx. SearchAction
//   CHƯA gắn vì /search chưa có thật (R1-5, FE 45-47) — gắn schema trỏ URL
//   404 là lỗi SEO. sameAs (mạng xã hội) bổ sung ở R1-5 khi SOC-01 chốt
//   URL thật, không đoán URL.
import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://awing.vn";

/** URL tuyệt đối của một trang theo locale, vd localizedUrl("vi", "/contact"). */
export function localizedUrl(locale: Locale, path = "/"): string {
  return `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
}

export function alternatesFor(locale: Locale, path = "/"): Metadata["alternates"] {
  return {
    canonical: localizedUrl(locale, path),
    languages: {
      vi: localizedUrl("vi", path),
      en: localizedUrl("en", path),
      "x-default": localizedUrl("vi", path),
    },
  };
}

export interface PageMetadataInput {
  locale: Locale;
  /** Đường dẫn không tiền tố locale, vd "/" hoặc "/contact". */
  path: string;
  title: string;
  description: string;
}

export function pageMetadata({ locale, path, title, description }: PageMetadataInput): Metadata {
  const url = localizedUrl(locale, path);
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      title,
      description,
      url,
      siteName: "AWING",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AWING",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AWING",
    url: SITE_URL,
    inLanguage: [...LOCALES],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
