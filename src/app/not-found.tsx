// Trang 404 toàn cục (FE 14) — nằm ngoài [locale] nên không có LocaleProvider:
// dùng song ngữ tĩnh, link về trang chủ /vi.
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="font-display text-6xl font-black text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-black text-ink">Không tìm thấy trang này</h1>
      <p className="mt-2 text-sm text-muted">Page not found — the link may be outdated or the page moved.</p>
      <Link
        href="/vi"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        ← Trang chủ
      </Link>
    </main>
  );
}
