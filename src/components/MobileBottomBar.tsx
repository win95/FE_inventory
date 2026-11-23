// CTA cố định dưới màn hình mobile (FE 17, Docs §4.1): chỉ hiện dưới
// breakpoint md. Nút Get data mở dialog lead; Talk to us sang /contact.
// Layout chừa padding-bottom tương ứng trên mobile để thanh này không che
// nội dung (xem [locale]/layout.tsx).
"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { withLocale } from "@/lib/i18n";

export default function MobileBottomBar({
  onOpenLead,
}: {
  onOpenLead: (source: string) => void;
}) {
  const { locale, t } = useLocale();
  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 flex gap-2 border-t border-border bg-white/95 p-3 backdrop-blur-sm md:hidden">
      <button
        type="button"
        onClick={() => onOpenLead("mobile-bar")}
        className="h-11 flex-1 rounded-lg bg-brand text-sm font-semibold text-white"
      >
        {t("nav.getData")}
      </button>
      <Link
        href={withLocale("/contact", locale)}
        className="flex h-11 flex-1 items-center justify-center rounded-lg border border-border text-sm font-medium text-ink"
      >
        {t("nav.talkToUs")}
      </Link>
    </div>
  );
}
