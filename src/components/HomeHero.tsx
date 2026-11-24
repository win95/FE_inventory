// Hero mới của Home (R1-3, FE 22): tiêu đề + mô tả từ Home single của
// Strapi, kèm tab 6 sản phẩm — mỗi tab đổi màu nhấn + CTA theo sản phẩm
// (màu/CTA đổi theo tab, FE 32). Tab dùng component Tabs dùng chung
// (mũi tên trái/phải để chuyển). CTA "Get data" mở dialog lead với source
// ghi rõ sản phẩm đang xem; "Xem chi tiết" sang trang Product.
"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCT_THEME } from "@/lib/product-theme";
import { useOpenLead } from "./LeadContext";
import { useLocale } from "./LocaleProvider";
import Button from "./ui/Button";
import Tabs from "./ui/Tabs";
import { withLocale } from "@/lib/i18n";
import type { CmsProduct } from "@/lib/types";

export default function HomeHero({
  heroTitle,
  heroSubtitle,
  products,
}: {
  heroTitle: string;
  heroSubtitle: string;
  products: CmsProduct[];
}) {
  const { t, locale } = useLocale();
  const openLead = useOpenLead();
  const [active, setActive] = useState(products[0]?.slug ?? "");
  const product = products.find((p) => p.slug === active) ?? products[0];

  return (
    <section className="bg-page">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-badge-border bg-badge-bg px-3 py-1 text-xs font-semibold tracking-widest text-brand uppercase">
          <span aria-hidden="true">✦</span> {t("hero.eyebrow")}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.08] font-black tracking-tight text-ink uppercase sm:text-6xl">
          {heroTitle}
        </h1>
        {heroSubtitle && <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{heroSubtitle}</p>}
        {products.length > 0 && product && (
          <div className="mt-10">
            <Tabs
              items={products.map((p) => ({ id: p.slug, label: p.name }))}
              value={product.slug}
              onChange={setActive}
              ariaLabel={t("nav.products")}
            />
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
              <div className={`h-1.5 ${PRODUCT_THEME[product.color].bar}`} aria-hidden="true" />
              <div className="p-6 sm:p-8">
                <p className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PRODUCT_THEME[product.color].badge}`}>
                  {product.name}
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">{product.tagline}</h2>
                <p className="mt-2 max-w-2xl text-base text-muted">{product.goal}</p>
                {product.description && <p className="mt-2 max-w-2xl text-sm text-muted">{product.description}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => openLead(`home-hero-${product.slug}`)}>
                    {t("nav.getData")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    href={withLocale(`/products/${product.slug}`, locale)}
                  >
                    {t("prod.viewDetails")}
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">
              <Link href={withLocale("/products", locale)} className="font-semibold text-brand hover:text-brand-dark">
                {t("common.viewAll")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
