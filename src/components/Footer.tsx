"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ContactInfo from "./ContactInfo";
import { useLocale } from "./LocaleProvider";

// Trang mẫu Figma không có footer nên màu footer theo cùng bảng màu Figma
// (nền trắng, viền #EBEBEB, chữ #6B6B80, tiêu đề #0D0D14).
// Link nhanh chỉ gồm các trang đã có thật: Home, Advertisers, Contact Us.
// Màn kết quả /advertisers không có footer trên Figma nên ẩn ở trang này.
export default function Footer() {
  const { t } = useLocale();
  const pathname = usePathname();
  if (pathname === "/advertisers") return null;
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-[22px] font-black tracking-tight">
            <span className="text-ink">A</span>
            <span className="text-brand">WING</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("footer.about")}</p>
        </div>
        <nav aria-label={t("footer.quickLinks")}>
          <p className="text-sm font-semibold text-ink">{t("footer.quickLinks")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/" className="hover:text-brand">{t("footer.home")}</Link></li>
            <li><Link href="/advertisers" className="hover:text-brand">{t("nav.advertisers")}</Link></li>
            <li><Link href="/contact" className="hover:text-brand">{t("footer.contact")}</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-ink">{t("footer.contact")}</p>
          <div className="mt-3">
            <ContactInfo />
          </div>
        </div>
      </div>
      <div className="border-t border-divider py-4 text-center text-xs text-muted">
        AWING — Home Public
      </div>
    </footer>
  );
}
