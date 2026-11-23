// Trang lỗi của route theo locale (FE 14) — boundary cho lỗi render/fetch
// trong [locale]. Song ngữ tĩnh (không dùng useLocale: error boundary không
// chắc chắn còn context). Nút Thử lại gọi reset() của Next.js.
"use client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-2xl font-black text-ink">Có lỗi xảy ra</h1>
      <p className="mt-2 text-sm text-muted">Something went wrong. Please try again.</p>
      {error?.digest && <p className="mt-2 text-xs text-muted">Mã lỗi: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Thử lại
      </button>
    </main>
  );
}
