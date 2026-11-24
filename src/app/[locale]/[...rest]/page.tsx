// Bắt mọi đường dẫn /vi/... hoặc /en/... không khớp route nào để 404 hiện
// bằng [locale]/not-found.tsx (có header/footer, chữ theo locale) thay vì
// trang 404 gốc ngoài [locale].
import { notFound } from "next/navigation";

// Trang này luôn notFound() nên không kiểm tra instant navigation được
// (giống các trang chi tiết khác trong [locale]).
export const instant = false;

export default function CatchAllNotFound() {
  notFound();
}
