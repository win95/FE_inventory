// Trang lỗi toàn cục (FE 14) — khi chính root layout lỗi. Phải tự render
// <html>/<body> của riêng mình và không được dùng Tailwind/globals.css
// (root layout đã lỗi nên CSS không chắc còn). Style inline tối giản.
"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#ffffff", color: "#111318" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Có lỗi xảy ra</h1>
          <p style={{ color: "#5b606b" }}>Something went wrong. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              height: 40,
              padding: "0 16px",
              border: "none",
              borderRadius: 8,
              background: "#d2232a",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
