// Trang pháp lý (R1-4, FE 41): T.Page + bản tóm tắt R1 (khóa legal.*).
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { translate, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/cookies", title: `${translate(loc, "legal.cookiesTitle")} — AWING`, description: translate(loc, "legal.cookiesP1") });
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return <LegalPage locale={loc} titleKey="legal.cookiesTitle" paragraphs={["legal.cookiesP1", "legal.cookiesP2", "legal.cookiesP3"]} />;
}
