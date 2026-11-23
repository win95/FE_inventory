// Lớp phủ tìm kiếm (FE 16 — vỏ R1-2, tìm kiếm đầy đủ ở R1-5 FE 45-47).
//
// Gõ để lọc ngay trong danh mục tĩnh: 6 sản phẩm, 26 solution và các trang
// đã có (không dấu, không phân biệt hoa thường). Kết quả có trang đích thì
// bấm để đi; chưa có trang (R1-3/R1-4) thì hiện mờ + không bấm được. Gợi ý
// mặc định lấy theo Figma mới (retail, heatmap, careers). R1-5 thay nguồn
// dữ liệu này bằng API /api/search của FastAPI, giao diện giữ nguyên.
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PRODUCTS, SEARCH_PRESETS } from "@/lib/products";
import { withLocale } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

interface SearchItem {
  label: string;
  hint: string;
  href: string | null;
  /** Từ khóa phụ để tìm được bằng tiếng Anh lẫn tiếng Việt. */
  keywords: string;
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");

  const items: SearchItem[] = useMemo(() => {
    const list: SearchItem[] = [];
    for (const product of PRODUCTS) {
      list.push({
        label: product.name,
        hint: product.slogan,
        href: null, // Trang /products/{slug} ở R1-3.
        keywords: product.slug,
      });
      for (const solution of product.solutions) {
        list.push({
          label: solution.name,
          hint: product.name,
          href: null, // Trang /products/{product}/{solution} ở R1-3.
          keywords: solution.slug,
        });
      }
    }
    list.push(
      {
        label: locale === "vi" ? "Trang chủ" : "Home",
        hint: "AWING",
        href: withLocale("/", locale),
        keywords: "home trang chu",
      },
      {
        label: locale === "vi" ? "Bản đồ nhiệt" : "Heatmap",
        hint: locale === "vi" ? "Mạng lưới địa điểm" : "Location Network",
        href: withLocale("/locations", locale),
        keywords: "heatmap location network ban do nhiet",
      },
      {
        label: locale === "vi" ? "Nhà quảng cáo" : "Advertisers",
        hint: locale === "vi" ? "Gợi ý chiến dịch" : "Campaign suggestions",
        href: withLocale("/advertisers", locale),
        keywords: "advertisers campaign nha quang cao",
      },
      {
        label: locale === "vi" ? "Liên hệ" : "Contact",
        hint: "contact@awing.vn",
        href: withLocale("/contact", locale),
        keywords: "contact lien he",
      },
    );
    return list;
  }, [locale]);

  const q = fold(query.trim());
  const results = q
    ? items.filter((item) =>
        fold(`${item.label} ${item.hint} ${item.keywords}`).includes(q),
      )
    : [];

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("search.title")}
      className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <div className="flex items-center gap-3 border-b-2 border-brand pb-3">
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("search.closeLabel")}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            ESC
          </button>
        </div>

        {!query.trim() && (
          <div className="mt-6">
            <p className="text-sm text-muted">{t("search.presets")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEARCH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuery(preset)}
                  className="rounded-full border border-border bg-white px-4 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted">{t("search.hint")}</p>
          </div>
        )}

        {query.trim() !== "" && results.length === 0 && (
          <p className="mt-6 text-sm text-muted">{t("search.noResults", { q: query.trim() })}</p>
        )}

        {results.length > 0 && (
          <ul className="mt-6 space-y-1">
            {results.slice(0, 8).map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-lg px-3 py-2 hover:bg-surface"
                  >
                    <span className="block text-sm font-medium text-ink">{item.label}</span>
                    <span className="block text-xs text-muted">{item.hint}</span>
                  </Link>
                ) : (
                  <span
                    className="block cursor-not-allowed rounded-lg px-3 py-2"
                    title={t("nav.noDestination")}
                  >
                    <span className="block text-sm font-medium text-muted/50">{item.label}</span>
                    <span className="block text-xs text-muted/50">{item.hint}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
