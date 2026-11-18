import Link from "next/link";
import { API_BASE_URL, isBackendConfigured } from "@/lib/api";

// Header / Menu (F01 + F13), màu theo đúng trang mẫu Figma:
// nền #F4F4F7 phẳng (không viền, không blur), link menu #6B6B80,
// logo chữ "A" đen + "WING" đỏ, nút "Tin dùng" đỏ #E8212B bo 8px.
// Quy tắc từ Plan: mỗi mục phải có đích đến thật hoặc disable rõ ràng —
// không để nút chết như trên trang mẫu. Đã verify: chỉ Advertisers (trang
// kết quả) và Contact Us có đích đến thật. Platform, Wi-Fi Partners,
// About Us, Media, Đối tác: chưa verify đích đến nên hiển thị mờ + không
// bấm được, chờ chốt ở mục 8 của Plan. Nút EN bị ẩn vì chưa có đa ngôn ngữ
// thật (F10). "Tin dùng" là CTA chính → dẫn tới form liên hệ (/contact).
export default function Header() {
  const googleAuthUrl = isBackendConfigured()
    ? `${API_BASE_URL}/api/auth/google`
    : null;

  return (
    <header className="sticky top-0 z-40 bg-page">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display text-[22px] font-black tracking-tight">
          <span className="text-ink">A</span>
          <span className="text-brand">WING</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <span className="cursor-not-allowed text-muted/50" title="Chưa có trang đích — để sau">
            Platform
          </span>
          <Link href="/advertisers" className="font-bold text-ink hover:text-brand">
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
          <span className="cursor-not-allowed text-muted/50" title="Chưa có trang đích — để sau">
            Đối tác
          </span>
        </nav>

        <div className="flex items-center gap-2">
          {googleAuthUrl ? (
            <a
              href={googleAuthUrl}
              className="rounded-lg border border-outline px-3 py-1.5 text-sm font-medium text-muted hover:border-muted"
            >
              Đăng nhập với Google
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Đăng nhập Google do backend xác thực — backend chưa được cấu hình nên tạm thời chưa dùng được."
              className="cursor-not-allowed rounded-lg border border-outline px-3 py-1.5 text-sm font-medium text-muted/50"
            >
              Đăng nhập với Google
            </button>
          )}
          <Link
            href="/contact"
            className="h-8 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Tin dùng
          </Link>
        </div>
      </div>

      <nav aria-label="Điều hướng chính trên mobile" className="flex gap-4 overflow-x-auto border-t border-divider px-4 py-2 text-sm font-medium text-muted md:hidden">
        <Link href="/advertisers" className="shrink-0 font-bold text-ink">
          Advertisers
        </Link>
        <Link href="/contact" className="shrink-0">
          Liên hệ
        </Link>
        <span className="shrink-0 text-muted/50">Platform</span>
        <span className="shrink-0 text-muted/50">Wi-Fi Partners</span>
        <span className="shrink-0 text-muted/50">About Us</span>
        <span className="shrink-0 text-muted/50">Media</span>
      </nav>
    </header>
  );
}
