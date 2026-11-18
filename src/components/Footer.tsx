import Link from "next/link";
import ContactInfo from "./ContactInfo";

// Footer (F16). Nội dung liên hệ lấy đúng trang Contact Us chính thức của
// AWING (https://awing.vn/vi/contact-us), kiểm tra trực tiếp ngày 18/11/2026.
// Trang mẫu Figma không có footer nên màu footer theo cùng bảng màu Figma
// (nền trắng, viền #EBEBEB, chữ #6B6B80, tiêu đề #0D0D14).
// Link nhanh chỉ gồm các trang đã có thật: Home, Advertisers, Contact Us.
export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-[22px] font-black tracking-tight">
            <span className="text-ink">A</span>
            <span className="text-brand">WING</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Kênh marketing theo vị trí trên di động tại Việt Nam — kết nối
            thương hiệu tới người dùng qua Wi-Fi tại địa điểm.
          </p>
        </div>
        <nav aria-label="Liên kết nhanh">
          <p className="text-sm font-semibold text-ink">Liên kết nhanh</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/" className="hover:text-brand">Trang chủ</Link></li>
            <li><Link href="/advertisers" className="hover:text-brand">Advertisers</Link></li>
            <li><Link href="/contact" className="hover:text-brand">Liên hệ</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-ink">Liên hệ</p>
          <div className="mt-3">
            <ContactInfo />
          </div>
        </div>
      </div>
      <div className="border-t border-divider py-4 text-center text-xs text-muted">
        AWING — Home Public (FE_inventory)
      </div>
    </footer>
  );
}
