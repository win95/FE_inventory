// Layout riêng cho /components (B2): trang tài liệu component nội bộ —
// không cho crawler index, không lấy canonical của trang chủ.
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    robots: { index: false, follow: false },
  };
}

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
