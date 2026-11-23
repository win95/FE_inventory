// Phân trang dùng chung (FE 7) — nút Trước/Sau + cửa sổ số trang (1 … c-1 c c+1 … N).
"use client";

import { useLocale } from "../LocaleProvider";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("…");
    out.push(nums[i]);
  }
  return out;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;
  const btn =
    "rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1.5">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t("ui.prevPage")}
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              p === page ? "bg-brand font-semibold text-white" : "border border-border bg-white text-ink hover:border-brand hover:text-brand"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t("ui.nextPage")}
      </button>
    </nav>
  );
}
