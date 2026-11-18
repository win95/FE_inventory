// Kiểu dữ liệu khớp với thiết kế API trong Plan AWING (§6–§7).
// Đây là kiểu tạm thời ở phía Frontend: nguồn sự thật là schema Pydantic
// của backend FastAPI — khi backend có OpenAPI, sinh lại kiểu TypeScript
// từ OpenAPI đó và thay file này. Không có dữ liệu mẫu ở đây.
//
// Cập nhật theo khám phá click trên Figma (~14:03 +07, 18/11):
// - Kết quả gợi ý có chip thành phố để bật/tắt (đổi tổng Reach/Engagement/
//   Impressions) — không có tab Top performing / Highest reach / Premium.
// - Ad format có thời lượng xem trước (6s/15s/30s).
// - Location Network có thư mục địa điểm + số liệu theo ngành (khi backend
//   cung cấp thì hiện, không có thì ẩn — không tự bịa).

export interface NetworkStats {
  connections: number | null;
  provinces: number | null;
  chains: number | null;
  venues: number | null;
}

export type CoverageLevel = "low" | "medium" | "high";

export interface ProvinceCoverage {
  province: string;
  level: CoverageLevel;
  venues: number;
}

export interface VenueTypeCount {
  type: string;
  count: number;
}

export interface LocationDirectoryEntry {
  name: string;
  category: string;
  venues: number;
}

export interface IndustryStat {
  industry: string;
  engagement: number | null;
  reach: number | null;
}

export interface CoverageResponse {
  provinces: ProvinceCoverage[];
  venueTypes: VenueTypeCount[];
  /** Thư mục địa điểm của Location Network (khi backend cung cấp). */
  directory?: LocationDirectoryEntry[];
  /** Số liệu theo ngành: Engagement by Industry + Reach vs Engagement. */
  industryStats?: IndustryStat[];
}

export interface CampaignOverview {
  locations: number;
  venues: number;
  reach: number | null;
  engagement: number | null;
  offPeak: number | null;
}

export interface SuggestedLocation {
  name: string;
  area: string;
  city: string;
  reach: number | null;
}

export interface AdFormat {
  name: string;
  metricLabel: string;
  metricValue: number | null;
  /** Thời lượng xem trước trong popup điện thoại, tính bằng giây. */
  durationSeconds?: number | null;
}

/** Một thành phố trong gợi ý — bật/tắt chip sẽ đổi tổng số liệu. */
export interface SuggestCity {
  name: string;
  reach: number | null;
  engagements: number | null;
  impressionsPerDay: number | null;
}

export interface SuggestResponse {
  overview: CampaignOverview;
  locations: SuggestedLocation[];
  formats: AdFormat[];
  /** Các thành phố được chọn cho gợi ý (khi backend cung cấp). */
  cities?: SuggestCity[];
}

export interface CaseStudy {
  title: string;
  industry: string;
  metricLabel: string;
  metricValue: number | null;
}

export interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactPayload {
  type: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "no-backend" };
