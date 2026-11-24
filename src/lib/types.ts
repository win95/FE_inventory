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

// Mức tương tác 1-5 theo đúng thang của trang mẫu Figma (bản đồ nhiệt
// Location Network): 1 Emerging, 2 Active, 3 Strong, 4 High, 5 Flagship.
export type CoverageLevel = 1 | 2 | 3 | 4 | 5;

export interface ProvinceCoverage {
  /** Khóa ổn định: tên tiếng Anh trong DB — dùng để khớp với lưới heatmap. */
  province: string;
  /** Tên hiển thị theo locale (?locale=vi|en); vi -> "Hà Nội", en -> "Ha Noi". */
  displayName?: string | null;
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
  /** Ghi chú dưới tên chuỗi, vd. "63 provinces", "24 cities", "Ha Noi". */
  subtitle: string;
  locations: number;
  /** Reach tính bằng triệu (vd. 4.2 = 4.2M). */
  reach: number | null;
}

export interface IndustryStat {
  industry: string;
  engagement: number | null;
  reach: number | null;
  /** Tổng impressions (nghìn) cho biểu đồ Engagement by Industry. */
  impressions: number | null;
}

export interface CityMonthlyStat {
  city: string;
  /** Nhãn ngắn cho trục X biểu đồ (vd. HCM), theo locale của request. */
  short?: string | null;
  /** Trung bình tháng (triệu) cho biểu đồ Reach vs Engagement by City. */
  monthlyReach: number | null;
  monthlyEngagements: number | null;
}

export interface CoverageResponse {
  provinces: ProvinceCoverage[];
  venueTypes: VenueTypeCount[];
  /** Thư mục địa điểm của Location Network (khi backend cung cấp). */
  directory?: LocationDirectoryEntry[];
  /** Số liệu theo ngành: Engagement by Industry + Reach vs Engagement. */
  industryStats?: IndustryStat[];
  /** Số liệu tháng theo thành phố cho biểu đồ Reach vs Engagement. */
  cities?: CityMonthlyStat[];
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
  /** Mô tả hiển thị trên thẻ format (theo Figma Advertisers). */
  description?: string | null;
}

/** Một thành phố trong gợi ý — bật/tắt chip sẽ đổi tổng số liệu. */
export interface SuggestCity {
  name: string;
  reach: number | null;
  engagements: number | null;
  impressionsPerDay: number | null;
  /** Tương tác trung bình tháng, đơn vị TRIỆU — số hiện trên chip khi được chọn. */
  monthlyEngagements?: number | null;
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
  /** Slug mới thêm R1-4 (backfill 23/11) — link tới /case-studies/[slug]. */
  slug: string;
  industry: string;
  metricLabel: string;
  metricValue: number | null;
  /** Mô tả ngắn hiển thị dưới headline (Strapi summary). */
  summary?: string | null;
  /** URL tuyệt đối của ảnh cover (Strapi media); null thì dùng khối màu. */
  coverUrl?: string | null;
}

export interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// Lead form R1-2 (LEAD-01, Docs §6.2): trường bắt buộc + tùy chọn + ẩn.
// Gửi qua POST /api/leads (mở rộng, BE 11); phone phải E.164 (+84...).
export interface LeadSubmitPayload {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry?: string;
  brand?: string;
  regions?: string[];
  notes?: string;
  message?: string;
  consentContact: boolean;
  consentMarketing: boolean;
  turnstileToken?: string | null;
  utm?: Record<string, string>;
  source?: string;
  language?: string;
  market?: string;
}

export interface LeadSubmitResponse {
  leadId: number;
  otpSent: boolean;
}

export interface OtpVerifyResponse {
  verified: boolean;
  leadToken: string;
}

export interface LeadProfilePayload {
  industry?: string;
  brand?: string;
  regions?: string[];
  notes?: string;
  consentMarketing?: boolean;
}

export interface NewsletterPayload {
  email: string;
  locale?: string;
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

// --- Nội dung CMS từ Strapi (R1-3/R1-4) -----------------------------------
// Kiểu đã map từ Strapi REST (xem src/lib/strapi.ts). Tên/slogan sản phẩm
// và solution giữ nguyên tiếng Anh ở cả 2 locale (theo Figma); các trường
// mô tả dịch theo locale. Richtext Strapi ở project này là string thuần
// (đoạn cách nhau bằng dòng trống), không phải Blocks JSON.

import type { ProductColor } from "./product-theme";

export type ProductColorKey = ProductColor;

export interface CmsSolutionSummary {
  name: string;
  slug: string;
  summary: string;
}

export interface CmsProduct {
  name: string;
  slug: string;
  tagline: string;
  goal: string;
  description: string;
  color: ProductColorKey;
  order: number;
  coverUrl: string | null;
  /** Solutions của sản phẩm (relation, đã populate). */
  solutions: CmsSolutionSummary[];
  /** Dynamic-zone blocks đã map sang kiểu Block của BlockRenderer. */
  blocks: import("@/components/blocks/BlockRenderer").Block[];
}

export interface CmsSolution {
  name: string;
  slug: string;
  summary: string;
  productSlug: string;
  productName: string;
  blocks: import("@/components/blocks/BlockRenderer").Block[];
}

export type AdFormatType = "video" | "banner" | "text";

export interface CmsAdFormat {
  name: string;
  slug: string;
  description: string;
  /** Loại định dạng (BE 5: trường formatType mới trên Strapi). */
  formatType: AdFormatType;
  durationSeconds: number | null;
  metricLabel: string;
  metricValue: number | null;
  solutionSlug: string | null;
  solutionName: string | null;
}

export interface CmsResource {
  title: string;
  slug: string;
  summary: string;
  type: string;
  /** Ngành — trường mới thêm R1-4 (backfill 23/11) để lọc ở /resources. */
  industry: string | null;
  publishedDate: string | null;
  /** Nội dung đầy đủ (richtext dạng string). */
  content: string;
}

export interface CmsEventAgendaItem {
  time: string;
  title: string;
}

export interface CmsEventSpeaker {
  name: string;
  role: string;
  company: string;
}

export interface CmsEvent {
  title: string;
  slug: string;
  /** Tóm tắt = đoạn đầu của description (schema Event không có summary). */
  summary: string;
  /** Mô tả đầy đủ (richtext dạng string). */
  content: string;
  startDate: string | null;
  endDate: string | null;
  mode: string | null;
  location: string | null;
  agenda: CmsEventAgendaItem[];
  speakers: CmsEventSpeaker[];
}

export interface CmsArticle {
  title: string;
  slug: string;
  /** Tóm tắt = đoạn đầu của content (schema Article không có summary). */
  summary: string;
  /** Nội dung đầy đủ (richtext dạng string). */
  content: string;
  publishedDate: string | null;
  category: string | null;
}

export interface CmsJob {
  title: string;
  slug: string;
  description: string;
  requirements: string;
  department: string;
  location: string;
  type: string;
  deadline: string | null;
}

export interface CmsPartner {
  name: string;
  slug: string;
  description: string;
  category: string;
  website: string | null;
  /** Chỉ hiển thị logo khi consent=true (FE 39). */
  consent: boolean;
}

export interface CmsCaseStudyLink {
  slug: string;
  title: string;
  metricLabel: string;
  metricValue: number | null;
}

export interface CmsCustomer {
  name: string;
  slug: string;
  industry: string;
  testimonial: string;
  consent: boolean;
  caseStudy: CmsCaseStudyLink | null;
}

export interface CmsFaq {
  slug: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface CmsHowItWorksStep {
  stepTitle: string;
  stepText: string;
}

export interface CmsHome {
  heroTitle: string;
  heroSubtitle: string;
  statsNote: string;
  howItWorks: CmsHowItWorksStep[];
}

export interface CmsSnapshotMetric {
  id: string;
  value: number;
  label: string;
  trend: string | null;
}

export interface CmsDataSnapshot {
  snapshotDate: string | null;
  note: string;
  metrics: CmsSnapshotMetric[];
}

export interface CmsSocialLink {
  platform: string;
  url: string;
}

/** Single Global (FE 48, SOC.01): tên site, email liên hệ, link mạng xã hội. */
export interface CmsGlobal {
  siteName: string;
  contactEmail: string;
  socialLinks: CmsSocialLink[];
}
