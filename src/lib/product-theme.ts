// Theme theo màu sản phẩm (Docs §7.2, quy tắc 80/20) — module thuần,
// KHÔNG "use client": trang server (danh sách / chi tiết Product) và
// component client (ProductCard, HomeHero) đều import từ đây. Đặt theme
// trong ProductCard (client) khiến server chỉ thấy client reference stub
// (undefined) và trang /products crash với "Cannot read properties of
// undefined (reading 'bar')" — lỗi gặp khi verify R1-3 ngày 23/11/2026.
// Class Tailwind phải viết tường minh để trình quét class tìm thấy.

export type ProductColor =
  | "location"
  | "retail"
  | "measurement"
  | "insight"
  | "network"
  | "adsmanager";

export const PRODUCT_COLOR_LABEL: Record<ProductColor, string> = {
  location: "Location-Based Channel",
  retail: "Retail Media & Activation",
  measurement: "Measurement",
  insight: "Insights",
  network: "Network",
  adsmanager: "Ads Manager",
};

export const PRODUCT_THEME: Record<ProductColor, { bar: string; badge: string; soft: string }> = {
  location: { bar: "bg-p-location", badge: "bg-p-location text-p-location-on", soft: "bg-p-location-light text-p-location-dark" },
  retail: { bar: "bg-p-retail", badge: "bg-p-retail text-p-retail-on", soft: "bg-p-retail-light text-p-retail-dark" },
  measurement: { bar: "bg-p-measurement", badge: "bg-p-measurement text-p-measurement-on", soft: "bg-p-measurement-light text-p-measurement-dark" },
  insight: { bar: "bg-p-insight", badge: "bg-p-insight text-p-insight-on", soft: "bg-p-insight-light text-p-insight-dark" },
  network: { bar: "bg-p-network", badge: "bg-p-network text-p-network-on", soft: "bg-p-network-light text-p-network-dark" },
  adsmanager: { bar: "bg-p-adsmanager", badge: "bg-p-adsmanager text-p-adsmanager-on", soft: "bg-p-adsmanager-light text-p-adsmanager-dark" },
};
