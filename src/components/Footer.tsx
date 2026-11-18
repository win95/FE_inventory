import Link from "next/link";
import ContactInfo from "./ContactInfo";

// Footer (F16). Nội dung liên hệ lấy đúng trang Contact Us chính thức của
// AWING (https://awing.vn/vi/contact-us), kiểm tra trực tiếp ngày 18/11/2026.
// Link nhanh chỉ gồm các trang đã có thật: Home, Advertisers, Contact Us.
export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            AWING<span className="text-red-600">.</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Kênh marketing theo vị trí trên di động tại Việt Nam — kết nối
            thương hiệu tới người dùng qua Wi-Fi tại địa điểm.
          </p>
        </div>
        <nav aria-label="Liên kết nhanh">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Liên kết nhanh</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li><Link href="/" className="hover:text-red-600">Trang chủ</Link></li>
            <li><Link href="/advertisers" className="hover:text-red-600">Advertisers</Link></li>
            <li><Link href="/contact" className="hover:text-red-600">Liên hệ</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Liên hệ</p>
          <div className="mt-3">
            <ContactInfo />
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
        AWING — Home Public (FE_inventory)
      </div>
    </footer>
  );
}
