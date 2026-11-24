// Thẻ sản phẩm (FE 8) — theme theo màu sản phẩm (Docs §7.2, quy tắc 80/20):
// nền trắng, điểm nhấn màu sản phẩm ở viền trên + badge. Dùng cho trang
// /products (R1-3) và khối "One ecosystem" trên Home.
"use client";

import Link from "next/link";
import { useLocale } from "../LocaleProvider";
import { PRODUCT_COLOR_LABEL, PRODUCT_THEME, type ProductColor } from "@/lib/product-theme";

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
