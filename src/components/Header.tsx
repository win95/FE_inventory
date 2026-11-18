import Link from "next/link";
import AuthSession from "./AuthSession";

// Header / Menu (F01 + F13), theo đúng markup trang mẫu Figma
// (file HTML tran gửi, 18/11/2026 — view Location Network):
// fixed, nền rgba(244,244,247,0.95) + blur(16px), border-b;
// logo Barlow Condensed Black text-xl tracking 0.12em;
// nav gap-7, link #6B6B80, hover về màu chữ chính;
// phải: nút EN có icon globe (hiện như Figma; bấm chưa chuyển ngôn ngữ
// thật — F10, chuyển ngôn ngữ giao diện là việc sau), "Đối tác" nút chữ,
// "Tin dùng" đỏ bo 4px font-medium hover red-700.
// Nút đăng nhập Google (F13) giữ lại, kiểu giống nút EN để cùng ngôn ngữ
// nút trên header. Các mục chưa có trang đích (Platform, Wi-Fi Partners,
// About Us, Media, Đối tác) hiển thị mờ + không bấm được, chờ chốt ở mục 8
// của Plan — không để nút chết như trên trang mẫu.
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

export default function Header() {
  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 border-b border-border"
      style={{ backgroundColor: "rgba(244, 244, 247, 0.95)", backdropFilter: "blur(16px)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-1 select-none">
          <span className="font-display text-xl font-black tracking-[0.12em] text-ink">A</span>
          <span className="font-display text-xl font-black tracking-[0.12em] text-brand">WING</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 text-sm text-muted md:flex">
          <span className="cursor-not-allowed text-muted/50" title="Chưa có trang đích — để sau">
            Platform
          </span>
          <Link href="/advertisers" className="transition-colors hover:text-ink">
            Advertisers
          </Link>
          <span className="cursor-not-allowed text-muted/50" title="Chưa có trang đích — để sau">
            Wi-Fi Partners
          </span>
          <span className="cursor-not-allowed text-muted/50" title="Chưa có trang đích — để sau">
            About Us
          </span>
          <span className="cursor-not-allowed text-muted/50" title="Chưa có trang đích — để sau">
            Media
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <AuthSession />
          <button
            type="button"
            title="Chuyển ngôn ngữ giao diện — đang làm (F10)"
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <GlobeIcon />
            EN
          </button>
          <span
            className="cursor-not-allowed px-4 py-1.5 text-sm text-muted/50"
            title="Chưa có trang đích — để sau"
          >
            Đối tác
          </span>
          <Link
            href="/contact"
            className="rounded bg-brand px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Tin dùng
          </Link>
        </div>
      </div>
    </header>
  );
}
