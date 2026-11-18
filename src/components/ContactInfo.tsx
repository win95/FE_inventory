// Thông tin liên hệ chính thức của AWING, lấy đúng trang Contact Us
// (https://awing.vn/vi/contact-us), kiểm tra trực tiếp ngày 18/11/2026.
// Dùng chung cho Footer và trang Contact Us để không lệch nhau.
export default function ContactInfo() {
  return (
    <ul className="space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
      <li>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Trụ sở chính: </span>
        Tầng 21, tòa VCCI, số 9 Đào Duy Anh, Phường Kim Liên, Hà Nội
      </li>
      <li>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Văn phòng chi nhánh: </span>
        Tầng 7, DC Tower, 111D Lý Chính Thắng, Thành phố Hồ Chí Minh
      </li>
      <li>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Indonesia: </span>
        AIA Central Tower 25th Floor, Jl. Jenderal Sudirman Kav. 48A, Jakarta
      </li>
      <li>Liên hệ quảng cáo: +84 901 0505 17</li>
      <li>Hợp tác mạng lưới: +84 979 931 193</li>
      <li>Hỗ trợ người dùng &amp; Wi-Fi: +84 973 0505 17</li>
      <li>
        Email:{" "}
        <a href="mailto:contact@awing.vn" className="font-medium text-zinc-900 hover:text-red-600 dark:text-zinc-50">
          contact@awing.vn
        </a>
      </li>
    </ul>
  );
}
