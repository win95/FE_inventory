import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Font đo được trên trang mẫu Figma: Inter cho nội dung,
// Barlow Condensed Black cho tiêu đề lớn. Cả hai đều có subset
// vietnamese để dấu tiếng Việt hiển thị đúng.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AWING — Kênh marketing theo vị trí",
  description:
    "AWING — kênh marketing theo vị trí trên di động tại Việt Nam: mô tả chiến dịch, nhận gợi ý địa điểm và hình thức quảng cáo, chạy và đo lường theo thời gian thực.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page text-ink">
        <Header />
        {/* Header fixed như trang mẫu Figma nên nội dung cần pt-16. */}
        <div className="flex-1 pt-16">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
