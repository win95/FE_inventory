// Breadcrumb dùng chung (FE 7) — mục cuối là trang hiện tại (aria-current).
"use client";

import Link from "next/link";
import { useLocale } from "../LocaleProvider";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useLocale();
  return (
    <nav aria-label={t("ui.breadcrumb")}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "font-medium text-ink" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-brand">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
