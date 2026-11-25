// Layout riêng cho /locations (B2): trang là client component nên không
// đặt generateMetadata trong page.tsx được — metadata phải ở layout của
// segment. Trước đây trang thừa hưởng metadata của [locale]/layout (canonical
// + title/description của trang chủ) nên Google coi là bản trùng của home.
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { translate, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({
    locale: loc,
    path: "/locations",
    title: `${translate(loc, "locations.title")} — AWING`,
    description: translate(loc, "locations.subtitle"),
  });
}

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
