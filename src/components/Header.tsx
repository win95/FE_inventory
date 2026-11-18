import Link from "next/link";
import { API_BASE_URL, isBackendConfigured } from "@/lib/api";

// Header / Menu (F01 + F13). Quy tắc từ Plan: mỗi mục phải có đích đến thật
// hoặc disable rõ ràng — không để nút chết như trên trang mẫu.
// Đã verify: chỉ Advertisers (trang kết quả) và Contact Us có đích đến thật.
// Platform, Wi-Fi Partners, About Us, Media, Đối tác: chưa verify đích đến
// nên hiển thị mờ + không bấm được, chờ chốt ở mục 8 của Plan.
// Nút EN bị ẩn vì chưa có đa ngôn ngữ thật (F10).
// "Tin dùng" là CTA chính → dẫn tới form liên hệ (/contact).
export default function Header() {
  const googleAuthUrl = isBackendConfigured()
    ? `${API_BASE_URL}/api/auth/google`
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          AWING<span className="text-red-600">.</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-300">
          <span className="cursor-not-allowed text-zinc-400" title="Chưa có trang đích — để sau">
            Platform
          </span>
          <Link href="/advertisers" className="text-zinc-900 hover:text-red-600 dark:text-zinc-50">
            Advertisers
          </Link>
          <span className="cursor-not-allowed text-zinc-400" title="Chưa có trang đích — để sau">
            Wi-Fi Partners
          </span>
          <span className="cursor-not-allowed text-zinc-400" title="Chưa có trang đích — để sau">
            About Us
          </span>
          <span className="cursor-not-allowed text-zinc-400" title="Chưa có trang đích — để sau">
            Media
          </span>
          <span className="cursor-not-allowed text-zinc-400" title="Chưa có trang đích — để sau">
            Đối tác
          </span>
        </nav>

        <div className="flex items-center gap-2">
          {googleAuthUrl ? (
            <a
              href={googleAuthUrl}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
            >
              Đăng nhập với Google
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Đăng nhập Google do backend xác thực — backend chưa được cấu hình nên tạm thời chưa dùng được."
              className="cursor-not-allowed rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-400 dark:border-zinc-800"
            >
              Đăng nhập với Google
            </button>
          )}
          <Link
            href="/contact"
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Tin dùng
          </Link>
        </div>
      </div>

      <nav aria-label="Điều hướng chính trên mobile" className="flex gap-4 overflow-x-auto border-t border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600 md:hidden dark:border-zinc-900 dark:text-zinc-300">
        <Link href="/advertisers" className="shrink-0 text-zinc-900 dark:text-zinc-50">
          Advertisers
        </Link>
        <Link href="/contact" className="shrink-0">
          Liên hệ
        </Link>
        <span className="shrink-0 text-zinc-400">Platform</span>
        <span className="shrink-0 text-zinc-400">Wi-Fi Partners</span>
        <span className="shrink-0 text-zinc-400">About Us</span>
        <span className="shrink-0 text-zinc-400">Media</span>
      </nav>
    </header>
  );
}
