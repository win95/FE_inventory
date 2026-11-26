import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
import { todayIso } from "@/lib/format";

// Layout cho mọi trang theo locale (/vi, /en — Docs §4.2, FE 4).
// Locale không hợp lệ → 404 (middleware đã chuyển đường dẫn không tiền tố
// về /vi, đây chỉ là chốt chặn cuối). Metadata theo locale: canonical tự
// trỏ + hreflang vi/en/x-default + Open Graph (FE 6); JSON-LD Organization
// + WebSite gắn trong body (SearchAction thêm ở R1-5 khi /search có thật).

// Global đọc trong "use cache" (Next 16 + cacheComponents): fetch
// force-cache thôi không còn được coi là dữ liệu đã cache khi prerender,
// layout sẽ chặn prerender mọi trang tĩnh (/privacy, /advertisers...).
// Tag "strapi:global" để POST /api/revalidate xóa cache khi Strapi publish.
// Lỗi phải bắt BÊN TRONG hàm cache: lỗi ném ra từ "use cache" làm hỏng
// prerender (build fail) dù bên ngoài có .catch — Strapi lỗi/chưa có
// Global (404) thì trả null, footer giữ nút mờ.
// Profile `global` (next.config.ts): revalidate 1 ngày, expire 30 ngày —
// Global đổi rất hiếm; publish vẫn làm mới ngay nhờ tag.
// Giữ "use cache" (không đổi sang "use cache: remote"): cả hai handler
// đều trỏ cùng wrapper Redis nên hành vi giống hệt nhau với dữ liệu
// prerender tĩnh này; "remote" chỉ khác khi cần cache ở request-time
// (xem use-cache-remote.md), layout không thuộc trường hợp đó.
async function getGlobal(locale: Locale) {
  "use cache";
  cacheLife("global");
  cacheTag("strapi:global");
  return fetchGlobal(locale).catch(() => null);
}

// Năm bản quyền: tính trong "use cache" — new Date() trực tiếp trong
// layout sẽ bị prerender chặn ở các trang tĩnh (customers, products...),
// còn giá trị cache ở build thì ổn định (năm chỉ đổi khi build lại).
async function getYear() {
  "use cache";
  cacheLife("global");
  return todayIso().slice(0, 4);
}

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
  const global = await getGlobal(locale as Locale);
  const year = await getYear();
  return (
    <LocaleProvider locale={locale as Locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
        }}
      />
      <SiteChrome>{children}</SiteChrome>
      {/* P0 K8s FE + cache: Footer dùng usePathname() (ẩn footer ở
          /advertisers) — hook runtime nên phải nằm trong Suspense, nếu
          không mọi trang tĩnh đều không prerender được (Next 16 chặn
          shell tĩnh khi gặp client hook ngoài Suspense). Footer ở cuối
          trang nên fallback null không ảnh hưởng LCP; footer vẫn render
          ở phía server trong cùng response (streaming), chỉ sau shell. */}
      <Suspense fallback={null}>
        <Footer socials={global?.socialLinks ?? []} year={year} />
      </Suspense>
      <ToastViewport />
    </LocaleProvider>
  );
}
