// Ảnh Open Graph mặc định (FE 49, R1-5): tự sinh bằng ImageResponse khi
// CMS không có ảnh cover. Đặt trong [locale]/ để áp dụng cho mọi trang
// theo locale — đặt ở gốc (src/app/) thì Next không gắn vào các trang
// [locale] (đã kiểm chứng: HTML không có og:image). pageMetadata() không
// đặt openGraph.images nên Next dùng ảnh này. Trang chi tiết có cover
// thật sẽ ghi đè bằng openGraph.images riêng khi CMS có ảnh.
// (Không đặt `runtime = "edge"` — cacheComponents cấm segment config đó.)
import { ImageResponse } from "next/og";

export const alt = "AWING — Connecting Brands with Real-World Consumer Moments";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tagline =
    locale === "en"
      ? "Connecting Brands with Real-World Consumer Moments"
      : "Kết nối thương hiệu với khoảnh khắc đời thực";
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "80px",
          backgroundColor: "#d2232a",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-2px" }}>AWING</div>
        <div style={{ marginTop: 24, fontSize: 32, lineHeight: 1.3, maxWidth: 900 }}>{tagline}</div>
        <div style={{ marginTop: 16, fontSize: 24, opacity: 0.85 }}>awing.vn</div>
      </div>
    ),
    { ...size },
  );
}
