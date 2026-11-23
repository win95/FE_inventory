import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocaleProvider from "@/components/LocaleProvider";

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
  title: "AWING — Mobile Location-Based Marketing",
  description:
    "AWING — Describe your campaign in plain words, get location and ad format suggestions, then run and measure in real time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page text-ink">
        <LocaleProvider>
          <Header />
          <div className="flex-1 pt-16">{children}</div>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
