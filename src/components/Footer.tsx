// Footer R1-2 (FE 18, Docs §4.4): 5 cột — Thương hiệu | Sản phẩm | Dữ
// liệu & Tài nguyên | Công ty + Hỗ trợ | Liên hệ (văn phòng, form nhận
// tin, thị trường). Mọi mục đều là link tới trang đã có thật (R1-3/R1-4);
// 3 mục Data chưa có trang ở R1 đã gỡ (thuộc R2). Form nhận tin gửi POST
// /api/newsletter (lưu email, double opt-in ở BE 17 / R1-4). Link mạng xã
// hội (FE 48, SOC.01) lấy từ single Global trong Strapi — có URL trong CMS
// thì là link thật, chưa có thì hiện mờ. Ẩn trên /advertisers như trang mẫu
// Figma.
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ContactInfo from "./ContactInfo";
import { useLocale } from "./LocaleProvider";
import { withLocale } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/products";
import { subscribeNewsletter } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { Modal } from "./ui";
import type { CmsSocialLink } from "@/lib/types";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  zalo: "Zalo OA",
  tiktok: "TikTok",
};

const SOCIALS = ["Facebook", "LinkedIn", "YouTube", "Zalo OA", "TikTok"];

export default function Footer({ socials = [], year }: { socials?: CmsSocialLink[]; year: string }) {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [newsState, setNewsState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [cookieOpen, setCookieOpen] = useState(false);
  if (pathname === withLocale("/advertisers", locale)) return null;

  const link = (label: string, href: string | null) =>
    href ? (
      <Link href={href} className="hover:text-brand">
        {label}
      </Link>
    ) : (
      <span className="cursor-not-allowed text-muted/50" title={t("nav.noDestination")}>
        {label}
      </span>
    );

  const submitNewsletter = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsState("error");
      return;
    }
    setNewsState("sending");
    try {
      await subscribeNewsletter({ email: trimmed, locale }, locale);
      setNewsState("done");
    } catch (err: unknown) {
      setNewsState("error");
      if (err instanceof ApiError) {
        // Lỗi backend đã có message tiếng Việt — hiện qua trạng thái lỗi.
        void err;
      }
    }
  };

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        <div>
          <p className="font-display text-[22px] font-black tracking-tight">
            <span className="text-ink">A</span>
            <span className="text-brand">WING</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("footer.about")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.length > 0
              ? socials.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:border-brand hover:text-brand"
                  >
                    {SOCIAL_LABELS[s.platform] ?? s.platform}
                  </a>
                ))
              : SOCIALS.map((name) => (
                  <span
                    key={name}
                    title={t("footer.socialSoon")}
                    className="cursor-not-allowed rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted/50"
                  >
                    {name}
                  </span>
                ))}
          </div>
        </div>

        <nav aria-label={t("footer.products")}>
          <p className="text-sm font-semibold text-ink">{t("footer.products")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {PRODUCTS.map((product) => (
              <li key={product.slug}>{link(product.name, withLocale(`/products/${product.slug}`, locale))}</li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.dataResources")}>
          <p className="text-sm font-semibold text-ink">{t("footer.dataResources")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {/* Data: chỉ Bản đồ nhiệt có trang ở R1; 3 mục còn lại thuộc R2. */}
            <li>{link(t("nav.dataHeatmap"), withLocale("/locations", locale))}</li>
            <li>{link(t("nav.resReports"), withLocale("/resources?type=report", locale))}</li>
            <li>{link(t("nav.resPapers"), withLocale("/resources?type=paper", locale))}</li>
            <li>{link(t("nav.resCaseStudies"), withLocale("/resources?type=case-study", locale))}</li>
            <li>{link(t("nav.resEvents"), withLocale("/events", locale))}</li>
            <li>{link(t("nav.resNews"), withLocale("/news", locale))}</li>
          </ul>
        </nav>

        <div>
          <nav aria-label={t("footer.company")}>
            <p className="text-sm font-semibold text-ink">{t("footer.company")}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>{link(t("nav.compAbout"), withLocale("/about", locale))}</li>
              <li>{link(t("nav.compPartners"), withLocale("/partners", locale))}</li>
              <li>{link(t("nav.compCustomers"), withLocale("/customers", locale))}</li>
              <li>{link(t("nav.compInvestors"), withLocale("/investors", locale))}</li>
              <li>{link(t("nav.compCareers"), withLocale("/careers", locale))}</li>
              <li>{link(t("nav.compContact"), withLocale("/contact", locale))}</li>
            </ul>
          </nav>
          <nav aria-label={t("footer.support")} className="mt-6">
            <p className="text-sm font-semibold text-ink">{t("footer.support")}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>{link(t("footer.faq"), withLocale("/faq", locale))}</li>
              <li>{link(t("footer.privacy"), withLocale("/privacy", locale))}</li>
              <li>{link(t("footer.terms"), withLocale("/terms", locale))}</li>
              <li>{link(t("footer.cookies"), withLocale("/cookies", locale))}</li>
              <li>
                <button
                  type="button"
                  onClick={() => setCookieOpen(true)}
                  className="hover:text-brand"
                >
                  {t("footer.cookieSettings")}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">{t("footer.contact")}</p>
          <div className="mt-3">
            <ContactInfo />
          </div>
          <form onSubmit={submitNewsletter} className="mt-5">
            <label htmlFor="footer-newsletter" className="text-sm font-medium text-ink">
              {t("footer.newsletter")}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="footer-newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.newsletterPlaceholder")}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
              />
              <button
                type="submit"
                disabled={newsState === "sending" || newsState === "done"}
                className="h-10 shrink-0 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40"
              >
                {t("footer.newsletterButton")}
              </button>
            </div>
            {newsState === "done" && (
              <p className="mt-2 text-xs text-green-700">{t("footer.newsletterDone")}</p>
            )}
            {newsState === "error" && (
              <p role="alert" className="mt-2 text-xs text-brand">
                {t("footer.newsletterError")}
              </p>
            )}
          </form>
          <div className="mt-5">
            <p className="text-xs text-muted">{t("footer.market")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink">
                awing.vn
              </span>
              <button
                type="button"
                onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-ink"
              >
                {locale === "vi" ? "English" : "Tiếng Việt"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-divider py-4 text-center text-xs text-muted">
        © {year} AWING
      </div>
      <Modal open={cookieOpen} onClose={() => setCookieOpen(false)} title={t("footer.cookieTitle")}>
        <p className="text-sm leading-6 text-muted">{t("footer.cookieBody")}</p>
      </Modal>
    </footer>
  );
}
