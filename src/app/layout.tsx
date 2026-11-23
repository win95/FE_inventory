import type { Metadata } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GTM_ID } from "@/lib/tracking";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800", "900"],
});

// Metadata mặc định (tiếng Anh, theo định vị mới). Metadata theo locale
// nằm ở [locale]/layout.tsx (generateMetadata); trang nào cũng có
// canonical/hreflang riêng ở FE 6.
export const metadata: Metadata = {
  title: "AWING — Connecting Brands with Real-World Consumer Moments",
  description:
    "AWING connects brands with real-world consumer moments across Vietnam — location-based channel, retail media, measurement, insights, network and ads manager.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page text-ink">
        {children}
        {/* GTM (FE 12) — chỉ load khi đã cấu hình NEXT_PUBLIC_GTM_ID. */}
        {GTM_ID ? (
          <>
            <Script id="gtm-init" strategy="afterInteractive">
              {"window.dataLayer = window.dataLayer || [];"}
            </Script>
            <Script
              id="gtm-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
