// Thông tin liên hệ chính thức của AWING, lấy đúng trang Contact Us
// (https://awing.vn/vi/contact-us), kiểm tra trực tiếp ngày 18/11/2026.
// Dùng chung cho Footer và trang Contact Us để không lệch nhau.
// Nhãn dịch theo locale; địa chỉ, số điện thoại, email giữ nguyên.
"use client";

import { useLocale } from "./LocaleProvider";

export default function ContactInfo() {
  const { t } = useLocale();
  return (
    <ul className="space-y-3 text-sm leading-6 text-muted">
      <li>
        <span className="font-medium text-ink">{t("contact.hq")}</span>
        Tầng 21, tòa VCCI, số 9 Đào Duy Anh, Phường Kim Liên, Hà Nội
      </li>
      <li>
        <span className="font-medium text-ink">{t("contact.branch")}</span>
        Tầng 7, DC Tower, 111D Lý Chính Thắng, Thành phố Hồ Chí Minh
      </li>
      <li>
        <span className="font-medium text-ink">Indonesia: </span>
        AIA Central Tower 25th Floor, Jl. Jenderal Sudirman Kav. 48A, Jakarta
      </li>
      <li>{t("contact.ads")}+84 901 0505 17</li>
      <li>{t("contact.network")}+84 979 931 193</li>
      <li>{t("contact.support")}+84 973 0505 17</li>
      <li>
        Email:{" "}
        <a href="mailto:contact@awing.vn" className="font-medium text-ink hover:text-brand">
          contact@awing.vn
        </a>
      </li>
    </ul>
  );
}
