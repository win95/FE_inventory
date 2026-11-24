// Khối CTA cuối trang Home (R1-3, FE 27): "Get data" mở dialog lead với
// source home-cta; "Talk to us" sang trang /contact (theo hành vi hiện tại
// của nút Talk to us trên mobile).
"use client";

import { useOpenLead } from "./LeadContext";
import { useLocale } from "./LocaleProvider";
import Button from "./ui/Button";
import { withLocale } from "@/lib/i18n";

export default function HomeCtaBand() {
  const { t, locale } = useLocale();
  const openLead = useOpenLead();
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl bg-brand px-6 py-10 text-center">
        <h2 className="font-display text-3xl font-black text-white">{t("home.ctaTitle")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/85">{t("home.ctaBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="light" size="lg" onClick={() => openLead("home-cta")}>
            {t("nav.getData")}
          </Button>
          <Button variant="light" size="lg" href={withLocale("/contact", locale)}>
            {t("nav.talkToUs")}
          </Button>
        </div>
      </div>
    </section>
  );
}
