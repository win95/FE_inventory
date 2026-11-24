// Phân trang phía server (R1-4): link với query giữ nguyên bộ lọc, dùng
// cho /resources, /news, /events, /careers. Khác Pagination (client, onChange).
import Link from "next/link";

export default function ServerPagination({
  page,
  totalPages,
  hrefFor,
  prevLabel,
  nextLabel,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  prevLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
  const btn =
    "rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink transition-colors hover:border-brand hover:text-brand";
  // FE 52: cho phép xuống dòng trên mobile — 10 nút trang + Trước/Sau
  // rộng 524px, tràn ở 360px nếu giữ một hàng.
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={btn}>
          {prevLabel}
        </Link>
      ) : (
        <span className={`${btn} cursor-not-allowed opacity-40`}>{prevLabel}</span>
      )}
      {nums.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            p === page ? "bg-brand font-semibold text-white" : "border border-border bg-white text-ink hover:border-brand hover:text-brand"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={btn}>
          {nextLabel}
        </Link>
      ) : (
        <span className={`${btn} cursor-not-allowed opacity-40`}>{nextLabel}</span>
      )}
    </nav>
  );
}
