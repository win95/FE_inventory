// Trang pháp lý (R1-4, FE 41): T.Page + bản tóm tắt R1 (khóa legal.*).
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { translate, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/terms", title: `${translate(loc, "legal.termsTitle")} — AWING`, description: translate(loc, "legal.termsP1") });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return <LegalPage locale={loc} titleKey="legal.termsTitle" paragraphs={["legal.termsP1", "legal.termsP2", "legal.termsP3"]} />;
}
