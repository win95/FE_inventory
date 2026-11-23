// Danh mục 6 sản phẩm + 26 Solution (Docs §2 D-03, §4.1).
//
// Nguồn: bản build Figma mới (event-lint-76243320.figma.site, 23/11/2026) —
// tên, slogan, thứ tự và 26 solution lấy đúng từ mã build đó. Tên sản phẩm
// và solution GIỮ TIẾNG ANH ở cả 2 locale (theo đúng Figma: mode VI vẫn
// hiện tên sản phẩm bằng tiếng Anh).
//
// Đây là dữ liệu điều hướng (IA) cho header/footer/tìm kiếm ở R1-2. Nội
// dung chi tiết (mô tả dài, block) sẽ lấy từ Strapi (Product/Solution) ở
// R1-3; khi đó file này chỉ còn giữ thứ tự + màu, hoặc bỏ hẳn.

export type ProductColor =
  | "location"
  | "retail"
  | "measurement"
  | "insight"
  | "network"
  | "adsmanager";

/** Màu chính / tối / nhạt của từng sản phẩm (Docs §7.2). */
export const PRODUCT_HEX: Record<
  ProductColor,
  { base: string; dark: string; light: string }
> = {
  location: { base: "#e31e24", dark: "#b4141a", light: "#fde8e9" },
  retail: { base: "#f36c02", dark: "#b84f00", light: "#fff0e2" },
  measurement: { base: "#f5c400", dark: "#8a6d00", light: "#fff8d6" },
  insight: { base: "#10ad5e", dark: "#0a7a42", light: "#e1f7ec" },
  network: { base: "#0f57ee", dark: "#0a3ca8", light: "#e4ecfe" },
  adsmanager: { base: "#703fbc", dark: "#4f2a8a", light: "#efe8fa" },
};

export interface SolutionInfo {
  slug: string;
  name: string;
}

export interface ProductInfo {
  slug: string;
  name: string;
  slogan: string;
  color: ProductColor;
  solutions: SolutionInfo[];
}

export const PRODUCTS: ProductInfo[] = [
  {
    slug: "location-based-channel",
    name: "Location-Based Channel",
    slogan: "The right people, in the right place, at the right moment.",
    color: "location",
    solutions: [
      { slug: "interactive-ad-experiences", name: "Interactive Ad Experiences" },
      { slug: "geo-targeted-campaigns", name: "Geo-Targeted Campaigns" },
      { slug: "place-based-audiences", name: "Place-Based Audiences" },
      { slug: "wifi-splash-engagement", name: "Wi-Fi Splash Engagement" },
      { slug: "always-on-reach", name: "Always-On Reach" },
    ],
  },
  {
    slug: "retail-media-activation",
    name: "Retail Media & Activation",
    slogan: "Put your brand next to the buying decision.",
    color: "retail",
    solutions: [
      { slug: "in-store-wifi-media", name: "In-Store Wi-Fi Media" },
      { slug: "shopper-activation", name: "Shopper Activation" },
      { slug: "mall-digital-promotions", name: "Mall Digital Promotions" },
      { slug: "sampling-and-coupons", name: "Sampling & Coupons" },
      { slug: "retail-partner-network", name: "Retail Partner Network" },
    ],
  },
  {
    slug: "measurement",
    name: "Measurement",
    slogan: "Prove impact with real numbers.",
    color: "measurement",
    solutions: [
      { slug: "footfall-attribution", name: "Footfall Attribution" },
      { slug: "brand-lift", name: "Brand Lift" },
      { slug: "campaign-reporting", name: "Campaign Reporting" },
      { slug: "offline-conversion", name: "Offline Conversion" },
    ],
  },
  {
    slug: "insights",
    name: "Insights",
    slogan: "Understand consumers through real-world moments.",
    color: "insight",
    solutions: [
      { slug: "audience-insights", name: "Audience Insights" },
      { slug: "location-trends", name: "Location Trends" },
      { slug: "category-benchmarks", name: "Category Benchmarks" },
      { slug: "custom-research", name: "Custom Research" },
    ],
  },
  {
    slug: "network",
    name: "Network",
    slogan: "The network behind the moments.",
    color: "network",
    solutions: [
      { slug: "partner-network", name: "Partner Network" },
      { slug: "wifi-monetization", name: "Wi-Fi Monetization" },
      { slug: "venue-onboarding", name: "Venue Onboarding" },
      { slug: "network-health", name: "Network Health" },
    ],
  },
  {
    slug: "ads-manager",
    name: "Ads Manager",
    slogan: "Plan, track and optimise on your own.",
    color: "adsmanager",
    solutions: [
      { slug: "campaign-builder", name: "Campaign Builder" },
      { slug: "audience-geo-targeting", name: "Audience & Geo Targeting" },
      { slug: "budget-and-bidding", name: "Budget & Bidding" },
      { slug: "live-reporting", name: "Live Reporting" },
    ],
  },
];

/** Gợi ý tìm kiếm mặc định (theo Figma mới). */
export const SEARCH_PRESETS = ["retail", "heatmap", "careers"];
