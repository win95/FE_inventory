// Header R1-2 (FE 15-17, Docs §4.1): giữ vỏ cố định của Figma cũ (nền mờ
// rgba(244,244,247,0.95) + blur, logo AWING, h-16) nhưng thay menu bằng
// IA mới: Products (mega menu 6 cột theo màu sản phẩm) + Data + Insights &
// Resources + Company (dropdown), thanh công cụ (Search, ngôn ngữ, Sign in
// 2 lựa chọn, Get data), menu mobile dạng Drawer.
//
// Trang chưa có ở R1-2 (Products/Solutions ở R1-3, Resources/Events/News /
// Company ở R1-4) hiện mờ + không bấm được — giữ quy ước "không nút chết"
// của dự án; chỉ các trang đã có thật (/locations, /advertisers, /contact,
// /) mới là link. Mega menu và dropdown đóng bằng Escape, bấm ngoài, và
// điều hướng bằng bàn phím (mũi tên trong dropdown, Tab trong mega menu).
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthSession from "./AuthSession";
import { useLocale } from "./LocaleProvider";
import { withLocale } from "@/lib/i18n";
import { PRODUCTS, PRODUCT_HEX } from "@/lib/products";
import { Drawer } from "./ui";

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface MenuLink {
  label: string;
  href: string | null;
}

export default function Header({
  onOpenSearch,
  onOpenLead,
}: {
  onOpenSearch: () => void;
  onOpenLead: (source: string) => void;
}) {
  const { locale, setLocale, t } = useLocale();
  const target = locale === "vi" ? "en" : "vi";
  // Menu đang mở: null | "products" | "data" | "insights" | "company".
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const toggleMenu = (id: string) => setOpenMenu((prev) => (prev === id ? null : id));

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        buttonRefs.current[openMenu]?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const dataLinks: MenuLink[] = [
    { label: t("nav.dataOverview"), href: null },
    { label: t("nav.dataExplorer"), href: null },
    { label: t("nav.dataHeatmap"), href: withLocale("/locations", locale) },
    { label: t("nav.dataMethodology"), href: null },
  ];
  const insightsLinks: MenuLink[] = [
    { label: t("nav.resReports"), href: null },
    { label: t("nav.resPapers"), href: null },
    { label: t("nav.resCaseStudies"), href: withLocale("/advertisers", locale) },
    { label: t("nav.resEvents"), href: null },
    { label: t("nav.resNews"), href: null },
  ];
  const companyLinks: MenuLink[] = [
    { label: t("nav.compAbout"), href: null },
    { label: t("nav.compPartners"), href: null },
    { label: t("nav.compCustomers"), href: null },
    { label: t("nav.compInvestors"), href: null },
    { label: t("nav.compCareers"), href: null },
    { label: t("nav.compContact"), href: withLocale("/contact", locale) },
  ];

  const renderLinks = (links: MenuLink[]) => (
    <ul role="menu" className="py-2">
      {links.map((link) => (
        <li key={link.label} role="none">
          {link.href ? (
            <Link
              role="menuitem"
              href={link.href}
              onClick={() => setOpenMenu(null)}
              className="block px-4 py-2 text-sm text-muted hover:bg-surface hover:text-ink"
            >
              {link.label}
            </Link>
          ) : (
            <span
              role="menuitem"
              aria-disabled="true"
              title={t("nav.noDestination")}
              className="block cursor-not-allowed px-4 py-2 text-sm text-muted/50"
            >
              {link.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  const menuButton = (id: string, label: string) => (
    <button
      type="button"
      ref={(el) => {
        buttonRefs.current[id] = el;
      }}
      aria-expanded={openMenu === id}
      aria-haspopup="true"
      onClick={() => toggleMenu(id)}
      className={`flex items-center gap-1.5 py-1 text-sm transition-colors hover:text-ink ${
        openMenu === id ? "font-medium text-ink" : ""
      }`}
    >
      {label}
      <ChevronIcon open={openMenu === id} />
    </button>
  );

  const dropdown = (id: string, label: string, links: MenuLink[]) => (
    <li className="relative">
      {menuButton(id, label)}
      {openMenu === id && (
        <div className="absolute top-full left-0 z-50 mt-2 w-56 rounded-xl border border-border bg-white py-1 shadow-lg">
          {renderLinks(links)}
        </div>
      )}
    </li>
  );

  const mobileGroup = (title: string, links: MenuLink[]) => (
    <details className="border-b border-divider py-3">
      <summary className="cursor-pointer text-sm font-semibold text-ink">{title}</summary>
      <ul className="mt-2 space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <Link
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className="block py-1.5 pl-2 text-sm text-muted hover:text-brand"
              >
                {link.label}
              </Link>
            ) : (
              <span className="block py-1.5 pl-2 text-sm text-muted/50">{link.label}</span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 border-b border-border"
      style={{ backgroundColor: "rgba(244, 244, 247, 0.95)", backdropFilter: "blur(16px)" }}
    >
      <div
        ref={navRef}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.menu")}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink md:hidden"
          >
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
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href={withLocale("/", locale)} className="flex items-center gap-1 select-none">
            <span className="font-display text-xl font-black tracking-[0.12em] text-ink">A</span>
            <span className="font-display text-xl font-black tracking-[0.12em] text-brand">WING</span>
          </Link>
        </div>

        <nav aria-label={t("nav.main")} className="hidden items-center gap-7 text-sm text-muted md:flex">
          <ul className="flex items-center gap-7">
            <li className="relative">{menuButton("products", t("nav.products"))}</li>
            {dropdown("data", t("nav.data"), dataLinks)}
            {dropdown("insights", t("nav.insights"), insightsLinks)}
            {dropdown("company", t("nav.company"), companyLinks)}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={t("nav.search")}
            title={t("nav.search")}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <SearchIcon />
          </button>
          <div className="hidden sm:block">
            <AuthSession />
          </div>
          <button
            type="button"
            onClick={() => setLocale(target)}
            title={t("nav.switchLanguage")}
            aria-label={t("nav.switchLanguage")}
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <GlobeIcon />
            {target === "en" ? "EN" : "VI"}
          </button>
          <button
            type="button"
            onClick={() => onOpenLead("header")}
            className="hidden rounded bg-brand px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 sm:block"
          >
            {t("nav.getData")}
          </button>
        </div>
      </div>

      {/* Mega menu Products: 6 cột theo màu sản phẩm (Docs §4.1). */}
      {openMenu === "products" && (
        <div className="absolute top-full right-0 left-0 border-b border-border bg-white shadow-lg">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-3 xl:grid-cols-6">
            {PRODUCTS.map((product) => {
              const hex = PRODUCT_HEX[product.color];
              return (
                <div key={product.slug} className="border-t-2 pt-3" style={{ borderColor: hex.base }}>
                  <p className="text-sm font-bold text-ink">{product.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{product.slogan}</p>
                  <ul className="mt-3 space-y-1.5">
                    {product.solutions.map((solution) => (
                      <li key={solution.slug}>
                        <span
                          title={t("nav.noDestination")}
                          className="cursor-not-allowed text-xs text-muted/60"
                        >
                          {solution.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("nav.menu")} side="left">
        <div className="grid gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenSearch();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted"
            >
              <SearchIcon />
              {t("nav.search")}
            </button>
            <button
              type="button"
              onClick={() => setLocale(target)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted"
            >
              <GlobeIcon />
              {target === "en" ? "EN" : "VI"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              onOpenLead("header-mobile");
            }}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white"
          >
            {t("nav.getData")}
          </button>
          <div>
            <details className="border-b border-divider py-3" open>
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {t("nav.products")}
              </summary>
              <div className="mt-3 space-y-4">
                {PRODUCTS.map((product) => {
                  const hex = PRODUCT_HEX[product.color];
                  return (
                    <div key={product.slug} className="border-l-2 pl-3" style={{ borderColor: hex.base }}>
                      <p className="text-sm font-bold text-ink">{product.name}</p>
                      <ul className="mt-1 space-y-1">
                        {product.solutions.map((solution) => (
                          <li key={solution.slug} className="text-xs text-muted/60">
                            {solution.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </details>
            {mobileGroup(t("nav.data"), dataLinks)}
            {mobileGroup(t("nav.insights"), insightsLinks)}
            {mobileGroup(t("nav.company"), companyLinks)}
          </div>
          <div className="border-t border-divider pt-4">
            <AuthSession />
          </div>
        </div>
      </Drawer>
    </header>
  );
}
