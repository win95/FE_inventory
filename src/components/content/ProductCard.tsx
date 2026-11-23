// Thẻ sản phẩm (FE 8) — theme theo màu sản phẩm (Docs §7.2, quy tắc 80/20):
// nền trắng, điểm nhấn màu sản phẩm ở viền trên + badge. Dùng cho trang
// /products (R1-3) và khối "One ecosystem" trên Home.
"use client";

import Link from "next/link";
import { useLocale } from "../LocaleProvider";

export type ProductColor =
  | "location"
  | "retail"
  | "measurement"
  | "insight"
  | "network"
  | "adsmanager";

export const PRODUCT_COLOR_LABEL: Record<ProductColor, string> = {
  location: "Location-Based Channel",
  retail: "Retail Media & Activation",
  measurement: "Measurement",
  insight: "Insights",
  network: "Network",
  adsmanager: "Ads Manager",
};

// Class Tailwind phải viết tường minh để trình quét class tìm thấy.
const PRODUCT_THEME: Record<ProductColor, { bar: string; badge: string; soft: string }> = {
  location: { bar: "bg-p-location", badge: "bg-p-location text-p-location-on", soft: "bg-p-location-light text-p-location-dark" },
  retail: { bar: "bg-p-retail", badge: "bg-p-retail text-p-retail-on", soft: "bg-p-retail-light text-p-retail-dark" },
  measurement: { bar: "bg-p-measurement", badge: "bg-p-measurement text-p-measurement-on", soft: "bg-p-measurement-light text-p-measurement-dark" },
  insight: { bar: "bg-p-insight", badge: "bg-p-insight text-p-insight-on", soft: "bg-p-insight-light text-p-insight-dark" },
  network: { bar: "bg-p-network", badge: "bg-p-network text-p-network-on", soft: "bg-p-network-light text-p-network-dark" },
  adsmanager: { bar: "bg-p-adsmanager", badge: "bg-p-adsmanager text-p-adsmanager-on", soft: "bg-p-adsmanager-light text-p-adsmanager-dark" },
};

export interface ProductCardProps {
  name: string;
  tagline: string;
  goal: string;
  color: ProductColor;
  solutions: string[];
  /** Link tới trang Product (R1-3); chưa có trang thì bỏ qua, không render link. */
  href?: string;
}

export default function ProductCard({ name, tagline, goal, color, solutions, href }: ProductCardProps) {
  const { t } = useLocale();
  const theme = PRODUCT_THEME[color];
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className={`h-1.5 ${theme.bar}`} aria-hidden="true" />
      <div className="p-6">
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badge}`}>
          {PRODUCT_COLOR_LABEL[color]}
        </span>
        <h3 className="mt-3 font-display text-xl font-bold text-ink">{name}</h3>
        <p className="mt-1 text-sm text-muted">{tagline}</p>
        <p className={`mt-3 inline-block rounded-lg px-2 py-1 text-xs font-medium ${theme.soft}`}>{goal}</p>
        <ul className="mt-4 space-y-1.5">
          {solutions.map((s) => (
            <li key={s} className="text-sm text-muted">
              · {s}
            </li>
          ))}
        </ul>
        {href && (
          <Link href={href} className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
            {t("prod.viewDetails")}
          </Link>
        )}
      </div>
    </article>
  );
}
