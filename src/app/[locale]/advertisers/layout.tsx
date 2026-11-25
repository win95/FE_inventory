// Layout riêng cho /advertisers (B2): trang là client component nên không
// đặt generateMetadata trong page.tsx được — metadata phải ở layout của
// segment. Trước đây trang thừa hưởng metadata của [locale]/layout (canonical
// + title/description của trang chủ) nên Google coi là bản trùng của home.
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({
    locale: loc,
    path: "/advertisers",
    title:
      loc === "en"
        ? "Advertising suggestions — AWING"
        : "Gợi ý quảng cáo — AWING",
    description:
      loc === "en"
        ? "Campaign suggestions for advertisers: suggested locations, ad formats and case studies across the AWING network in Vietnam."
        : "Gợi ý chiến dịch cho nhà quảng cáo: địa điểm gợi ý, định dạng quảng cáo và case study trên mạng lưới AWING tại Việt Nam.",
  });
}

export default function AdvertisersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
