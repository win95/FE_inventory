// Kiểu dữ liệu khớp với thiết kế API trong Plan AWING (§6–§7).
// Đây là kiểu tạm thời ở phía Frontend: nguồn sự thật là schema Pydantic
// của backend FastAPI — khi backend có OpenAPI, sinh lại kiểu TypeScript
// từ OpenAPI đó và thay file này. Không có dữ liệu mẫu ở đây.

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

export interface CoverageResponse {
  provinces: ProvinceCoverage[];
  venueTypes: VenueTypeCount[];
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
}

export interface SuggestResponse {
  overview: CampaignOverview;
  locations: SuggestedLocation[];
  formats: AdFormat[];
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
