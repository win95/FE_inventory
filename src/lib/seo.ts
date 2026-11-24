// SEO framework (FE 6) — canonical / hreflang / sitemap / JSON-LD dùng chung.
//
// - Domain lấy từ NEXT_PUBLIC_SITE_URL (mặc định https://awing.vn — FIX-01:
//   sitemap/robots/canonical phải trỏ domain thật, không trỏ staging).
// - Mọi trang locale đều dùng pageMetadata(): canonical tự trỏ (FIX-02),
//   hreflang vi + en + x-default (FIX-03/04), Open Graph + Twitter.
// - JSON-LD: Organization + WebSite gắn ở [locale]/layout.tsx. SearchAction
//   gắn từ R1-5 (FE 45-47) vì /search đã có thật. sameAs (mạng xã hội) vẫn
//   CHƯA gắn — chỉ bổ sung khi SOC-01 chốt URL thật, không đoán URL.
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
  // Alt ảnh OG theo locale (alt tĩnh của opengraph-image.tsx chỉ có 1 bản).
  const ogImage = {
    url: `${SITE_URL}/${locale}/opengraph-image`,
    width: 1200,
    height: 630,
    alt:
      locale === "en"
        ? "AWING — Connecting Brands with Real-World Consumer Moments"
        : "AWING — Kết nối thương hiệu với khoảnh khắc đời thực",
  };
  return {
    // metadataBase để ảnh OG (file opengraph-image.tsx) và mọi URL tương
    // đối trong metadata ra URL tuyệt đối với domain thật — không có nó,
    // Next dùng http://localhost:3000 (cảnh báo ở log build).
    metadataBase: new URL(SITE_URL),
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
      // Ảnh OG mặc định: file [locale]/opengraph-image.tsx. Đặt tường minh
      // ở đây vì trang nào tự định nghĩa generateMetadata (vd /search,
      // /contact) thì Next không gắn ảnh file-based nữa — chỉ trang không
      // có generateMetadata riêng (vd home) mới tự nhận ảnh file. URL theo
      // locale để ảnh đúng ngôn ngữ (file [locale]/opengraph-image.tsx).
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
    // /search có thật từ R1-5 (FE 46) — target dùng locale vi (x-default).
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/vi/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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
