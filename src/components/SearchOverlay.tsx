// Lớp phủ tìm kiếm (FE 45-47, R1-5) — gợi ý từ API /api/search của FastAPI
// (BE 18-20: đọc Strapi live, cache 5 phút, khớp không dấu; khi BE không
// tới được thì dùng danh mục tĩnh 6 sản phẩm + 26 solution + các trang như
// R1-2). Debounce 200 ms, điều hướng bằng phím mũi tên + Enter, Esc đóng,
// Ctrl+K hoặc "/" mở (SiteChrome), link "Xem tất cả" sang trang /search.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCTS, SEARCH_PRESETS } from "@/lib/products";
import { searchContent, type SearchResultItem } from "@/lib/api";
import { withLocale, type DictKey } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

interface StaticItem {
  label: string;
  hint: string;
  href: string | null;
  /** Từ khóa phụ để tìm được bằng tiếng Anh lẫn tiếng Việt. */
  keywords: string;
  /** Dạng chuẩn SearchResultItem để dùng chung đường render với API. */
  type: string;
  slug: string;
  path: string;
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const TYPE_KEYS: Record<string, DictKey> = {
  products: "search.typeProducts",
  solutions: "search.typeSolutions",
  resources: "search.typeResources",
  events: "search.typeEvents",
  news: "search.typeNews",
  jobs: "search.typeJobs",
  page: "search.typePage",
};

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // FE 47: mặc định tìm theo ngôn ngữ hiện tại, có lựa chọn tất cả.
  const [scope, setScope] = useState<"current" | "all">("current");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [active, setActive] = useState(-1);
  const reqId = useRef(0);

  const staticItems: StaticItem[] = useMemo(() => {
    const list: StaticItem[] = [];
    for (const product of PRODUCTS) {
      list.push({
        label: product.name,
        hint: product.slogan,
        href: withLocale(`/products/${product.slug}`, locale),
        keywords: product.slug,
        type: "products",
        slug: product.slug,
        path: `/products/${product.slug}`,
      });
      for (const solution of product.solutions) {
        list.push({
          label: solution.name,
          hint: product.name,
          href: withLocale(`/products/${product.slug}/${solution.slug}`, locale),
          keywords: solution.slug,
          type: "solutions",
          slug: solution.slug,
          path: `/products/${product.slug}/${solution.slug}`,
        });
      }
    }
    list.push(
      {
        label: locale === "vi" ? "Trang chủ" : "Home",
        hint: "AWING",
        href: withLocale("/", locale),
        keywords: "home trang chu",
        type: "page",
        slug: "home",
        path: "/",
      },
      {
        label: locale === "vi" ? "Bản đồ nhiệt" : "Heatmap",
        hint: locale === "vi" ? "Mạng lưới địa điểm" : "Location Network",
        href: withLocale("/locations", locale),
        keywords: "heatmap location network ban do nhiet",
        type: "page",
        slug: "locations",
        path: "/locations",
      },
      {
        label: locale === "vi" ? "Nhà quảng cáo" : "Advertisers",
        hint: locale === "vi" ? "Gợi ý chiến dịch" : "Campaign suggestions",
        href: withLocale("/advertisers", locale),
        keywords: "advertisers campaign nha quang cao",
        type: "page",
        slug: "advertisers",
        path: "/advertisers",
      },
      {
        label: locale === "vi" ? "Liên hệ" : "Contact",
        hint: "contact@awing.vn",
        href: withLocale("/contact", locale),
        keywords: "contact lien he",
        type: "page",
        slug: "contact",
        path: "/contact",
      },
    );
    return list;
  }, [locale]);

  const q = query.trim();

  // Xóa query thì dọn luôn kết quả ngay trong handler — không setState
  // đồng bộ trong effect (luật react-hooks/set-state-in-effect).
  const onQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim() === "") {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setApiDown(false);
      setActive(-1);
    }
  };

  // Gợi ý từ API, debounce 200 ms (FE 45: < 200 ms). Số thứ tự request
  // chặn phản hồi cũ đè phản hồi mới khi gõ nhanh. setState chỉ nằm trong
  // callback bất đồng bộ (setTimeout / then), không chạy đồng bộ trong effect.
  useEffect(() => {
    if (!open || q === "") return;
    const id = ++reqId.current;
    const timer = setTimeout(() => {
      setLoading(true);
      searchContent(q, { locale: scope === "all" ? "all" : locale, pageSize: 8 }, locale)
        .then((res) => {
          if (id !== reqId.current) return;
          setResults(res.results);
          setTotal(res.total);
          setApiDown(false);
          setActive(-1);
        })
        .catch(() => {
          if (id !== reqId.current) return;
          // BE không tới được: dùng danh mục tĩnh, vẫn tìm được sản phẩm.
          setResults([]);
          setTotal(0);
          setApiDown(true);
          setActive(-1);
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [q, scope, open, locale]);

  // Danh mục tĩnh chỉ dùng khi API lỗi — cùng cách khớp không dấu như BE,
  // chuẩn hóa về dạng SearchResultItem để dùng chung đường render.
  const fallbackResults: SearchResultItem[] = useMemo(() => {
    if (!apiDown || q === "") return [];
    const fq = fold(q);
    return staticItems
      .filter((item) => fold(`${item.label} ${item.hint} ${item.keywords}`).includes(fq))
      .map((item) => ({
        type: item.type,
        slug: item.slug,
        title: item.label,
        summary: item.hint,
        url: item.path,
        locale,
        market: "",
        date: null,
      }));
  }, [apiDown, q, staticItems, locale]);

  const shown = apiDown ? fallbackResults : results;
  // Hàng "Xem tất cả" là mục cuối của danh sách điều hướng bằng phím.
  const navCount = shown.length + (q !== "" && total > shown.length ? 1 : 0);

  const goTo = (href: string) => {
    onClose();
    router.push(href);
  };

  const searchPageHref = withLocale(
    `/search?q=${encodeURIComponent(q)}&locale=${scope === "all" ? "all" : locale}`,
    locale,
  );

  const itemHref = (item: SearchResultItem) =>
    withLocale(item.url, item.locale === "vi" || item.locale === "en" ? item.locale : locale);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (navCount === 0) return;
      setActive((prev) =>
        e.key === "ArrowDown"
          ? prev + 1 >= navCount
            ? 0
            : prev + 1
          : prev - 1 < 0
            ? navCount - 1
            : prev - 1,
      );
      return;
    }
    if (e.key === "Enter") {
      if (active >= 0 && active < shown.length) {
        goTo(itemHref(shown[active]));
      } else if (active === shown.length && total > shown.length) {
        goTo(searchPageHref);
      } else if (q !== "") {
        goTo(searchPageHref);
      }
    }
  };

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
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            aria-expanded={shown.length > 0}
            aria-activedescendant={active >= 0 && active < shown.length ? `search-item-${active}` : undefined}
            role="combobox"
            aria-controls="search-suggestions"
            aria-autocomplete="list"
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

        <div className="mt-3 flex items-center gap-2" role="group" aria-label={t("search.scopeLabel")}>
          <button
            type="button"
            onClick={() => setScope("current")}
            aria-pressed={scope === "current"}
            className={`rounded-full border px-3 py-1 text-xs ${scope === "current" ? "border-brand bg-brand text-white" : "border-border text-muted hover:text-ink"}`}
          >
            {t("search.scopeCurrent")}
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            aria-pressed={scope === "all"}
            className={`rounded-full border px-3 py-1 text-xs ${scope === "all" ? "border-brand bg-brand text-white" : "border-border text-muted hover:text-ink"}`}
          >
            {t("search.scopeAll")}
          </button>
        </div>

        {q === "" && (
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

        {q !== "" && loading && <p className="mt-6 text-sm text-muted">{t("search.loading")}</p>}

        {q !== "" && !loading && shown.length === 0 && (
          <p className="mt-6 text-sm text-muted">{t("search.noResults", { q })}</p>
        )}

        {shown.length > 0 && (
          <ul id="search-suggestions" role="listbox" className="mt-6 space-y-1">
            {shown.map((item, i) => {
              const typeLabel = TYPE_KEYS[item.type] ? t(TYPE_KEYS[item.type]) : item.type;
              return (
                <li key={`${item.type}-${item.slug}-${item.locale}`} id={`search-item-${i}`} role="option" aria-selected={active === i}>
                  <Link
                    href={itemHref(item)}
                    onClick={onClose}
                    onMouseEnter={() => setActive(i)}
                    className={`block rounded-lg px-3 py-2 ${active === i ? "bg-surface" : "hover:bg-surface"}`}
                  >
                    <span className="block text-sm font-medium text-ink">
                      {item.title}
                      <span className="ml-2 text-xs font-normal text-muted">{typeLabel}</span>
                    </span>
                    {item.summary !== "" && (
                      <span className="block text-xs text-muted">{item.summary}</span>
                    )}
                  </Link>
                </li>
              );
            })}
            {total > shown.length && (
              <li>
                <Link
                  href={searchPageHref}
                  onClick={onClose}
                  onMouseEnter={() => setActive(shown.length)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium text-brand ${active === shown.length ? "bg-surface" : "hover:bg-surface"}`}
                >
                  {t("search.viewAll", { n: String(total), q })}
                </Link>
              </li>
            )}
          </ul>
        )}
        {apiDown && shown.length > 0 && (
          <p className="mt-4 text-xs text-muted">{t("search.offlineNote")}</p>
        )}
      </div>
    </div>
  );
}
