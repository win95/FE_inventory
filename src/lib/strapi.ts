// Client nội dung Strapi (FE 5) — tầng dữ liệu duy nhất cho CMS.
//
// - Mọi nội dung CMS (case study, bài viết, product, home...) đều đi qua
//   đây, có type, lọc theo locale (+ market khi BE 5 thêm trường market
//   trên Strapi — hiện chưa caller nào truyền market).
// - Chạy được cả phía server (trang ISR/SSR) lẫn phía client (component
//   tương tác): khi chạy server và có tag thì fetch gắn `next.tags` để
//   POST /api/revalidate làm mới được; khi chạy client thì fetch thường
//   (Next không cache fetch phía client).
// - Strapi chưa cấu hình → trả rỗng, không throw; CMS lỗi HTTP → throw
//   ApiError để trang hiện trạng thái lỗi, không crash (fallback FE 5).
// - Tag đặt tên theo quy ước `strapi:<collection>` để webhook biết xóa tag nào.
import { connection } from "next/server";
import { translate, type Locale } from "./i18n";
import { ApiError } from "./errors";
import type { CaseStudy, CmsCustomer, CmsFaq, CmsGlobal, CmsJob, CmsPartner } from "./types";

export const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ?? "";

// Địa chỉ gọi API Strapi. Phía server (SSR trong container Docker) thì
// localhost:1337 là chính container frontend, không tới được Strapi — dùng
// STRAPI_INTERNAL_URL (vd http://strapi:1337 trong docker compose) nếu có.
// URL media dựng từ base này rồi phục vụ qua /_next/image — trình duyệt
// không gọi thẳng Strapi.
function strapiFetchBase(): string {
  if (typeof window === "undefined") {
    const internal = process.env.STRAPI_INTERNAL_URL?.replace(/\/$/, "");
    if (internal) return internal;
  }
  return STRAPI_BASE_URL;
}

export function isStrapiConfigured(): boolean {
  return STRAPI_BASE_URL.length > 0;
}

export interface StrapiListResponse<T> {
  data?: T[];
}

/** Chế độ cache của fetch Strapi: "force-cache" cho trang tĩnh (đọc qua
 * Next Data Cache, làm mới bằng tag khi publish), "no-store" cho trang
 * động (đọc mới mỗi request). Không đặt thì giữ mặc định của Next. */
export type StrapiCacheMode = "force-cache" | "no-store";

export interface StrapiListOptions {
  locale: Locale;
  /** Lọc theo trường market (chỉ dùng từ BE 5, khi Strapi đã có trường này). */
  market?: string;
  /** populate Strapi, vd "cover". */
  populate?: string;
  /** Tag cache cho revalidate, vd "strapi:case-studies". Chỉ có tác dụng phía server. */
  tag?: string;
  /** Chế độ cache của fetch (xem StrapiCacheMode). Đặt "force-cache"
   * thì fetch còn gắn `next.revalidate = 3600` (profile `content` trong
   * next.config.ts) để làm mới nền mỗi giờ — tag invalidation khi publish
   * vẫn là cơ chế làm mới chính. */
  cache?: StrapiCacheMode;
  /** Số mục tối đa (mặc định Strapi là 25 — phải đặt rõ cho danh sách dài, vd. 118 bài News). */
  pageSize?: number;
  /** Trang (mặc định 1). Strapi giới hạn pageSize tối đa 100 nên danh sách
   * dài (118 bài News) phải đọc nhiều trang rồi nối lại. */
  page?: number;
  /** Sắp xếp phía Strapi, vd "publishedDate:desc" — bắt buộc khi chỉ lấy
   * vài mục mới nhất (fetch limit nhỏ rồi sort trong bộ nhớ sẽ sai). */
  sort?: string;
  /** Populate sâu 1 cấp trong dynamic zone / component, vd. ["blocks"]:
   * Strapi chỉ trả component trong DZ khi populate=blocks, còn các
   * repeatable lồng trong đó (items/steps) thì KHÔNG — phải thêm
   * populate[blocks][populate]=* thì items/steps mới về. */
  deepPopulate?: string[];
}

// --- Single-flight + circuit breaker + timeout cho fetch Strapi -----------
// (P0 K8s FE + cache, §6.2/§6.3 thiết kế). Đặt ở đây — không đặt trong
// cache handler — vì handler không gọi origin: mọi lần đọc Strapi đều đi
// qua strapiFetch dưới đây nên gộp + ngắt mạch ở đây là đủ.
//
// - Single-flight: nhiều request đồng thời cùng URL chỉ tạo 1 HTTP request
//   thật, còn lại chờ chung kết quả (body đọc 1 lần rồi chia nhau qua
//   Response mới dựng từ text).
// - Circuit breaker: lỗi mạng/timeout/5xx liên tiếp thì ngừng gọi Strapi
//   một lúc — tầng cache phục vụ bản cũ (hoặc trang hiện lỗi) thay vì treo
//   chờ Strapi. 4xx không tính là lỗi mạch (404 single = "chưa có nội
//   dung", không phải Strapi chết).
// - Timeout: fetch Strapi quá 10 giây (env STRAPI_FETCH_TIMEOUT_MS) thì
//   hủy — request không được treo theo Strapi chậm.
const STRAPI_FETCH_TIMEOUT_MS = Number(process.env.STRAPI_FETCH_TIMEOUT_MS ?? 10000) || 10000;
const BREAKER_FAILURE_THRESHOLD = 5; // Lỗi liên tiếp thì mở mạch.
const BREAKER_COOLDOWN_MS = 30000; // Mở 30 giây rồi cho 1 request thử lại.
const inflightStrapiFetch = new Map<string, Promise<{ status: number; text: string }>>();
const strapiBreaker = { failures: 0, open: false, openedAt: 0, halfOpen: false };

// Đo cooldown bằng performance.now() (đồng hồ đơn điệu), KHÔNG dùng
// Date.now(): với cacheComponents, Date.now() trong lúc prerender (vd. build
// Docker không tới được Strapi → mạch mở) làm `next build` lỗi
// "blocking-prerender-current-time". Cooldown chỉ cần khoảng thời gian
// tương đối nên performance.now() đúng ngữ nghĩa hơn.
function breakerNow(): number {
  return performance.now();
}

function isBreakerOpen(): boolean {
  if (!strapiBreaker.open) return false;
  if (breakerNow() - strapiBreaker.openedAt < BREAKER_COOLDOWN_MS) return true;
  // Hết cooldown: cho đúng 1 request thử lại (half-open).
  strapiBreaker.open = false;
  strapiBreaker.openedAt = 0;
  strapiBreaker.halfOpen = true;
  return false;
}

function noteStrapiSuccess(): void {
  strapiBreaker.failures = 0;
  strapiBreaker.open = false;
  strapiBreaker.openedAt = 0;
  strapiBreaker.halfOpen = false;
}

function noteStrapiFailure(): void {
  if (strapiBreaker.halfOpen) {
    // Request thử lại thất bại → mở mạch ngay, không đợi đủ 5 lỗi.
    strapiBreaker.halfOpen = false;
    strapiBreaker.failures = BREAKER_FAILURE_THRESHOLD;
    strapiBreaker.open = true;
    strapiBreaker.openedAt = breakerNow();
    return;
  }
  strapiBreaker.failures += 1;
  if (strapiBreaker.failures >= BREAKER_FAILURE_THRESHOLD) {
    strapiBreaker.open = true;
    strapiBreaker.openedAt = breakerNow();
  }
}

/**
 * Fetch Strapi qua single-flight + circuit breaker + timeout. Trả về
 * Response thật (dựng từ text đã đọc) để caller dùng như cũ (status,
 * ok, json()). Mạch đang mở thì throw ApiError strapiUnreachable ngay
 * (caller đã bắt lỗi này sẵn) — không gọi Strapi.
 */
async function strapiFetch(url: string, init: RequestInit, locale: Locale): Promise<Response> {
  // Request giống hệt đang chạy thì chờ chung, kể cả khi mạch vừa mở.
  const cacheMode = (init as { cache?: string }).cache ?? "";
  const key = `${cacheMode}|${url}`;
  const pending = inflightStrapiFetch.get(key);
  if (pending) {
    const shared = await pending;
    return new Response(shared.text, { status: shared.status });
  }
  if (isBreakerOpen()) {
    throw new ApiError(translate(locale, "api.strapiUnreachable"), 0);
  }
  const promise = (async () => {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(STRAPI_FETCH_TIMEOUT_MS) });
    } catch (error) {
      // Timeout (AbortError) cũng là lỗi mạng — tính vào mạch.
      noteStrapiFailure();
      throw error;
    }
    const text = await res.text();
    if (res.status >= 500) noteStrapiFailure();
    else noteStrapiSuccess();
    return { status: res.status, text };
  })();
  inflightStrapiFetch.set(key, promise);
  try {
    const shared = await promise;
    return new Response(shared.text, { status: shared.status });
  } finally {
    inflightStrapiFetch.delete(key);
  }
}

/**
 * Strapi không tới được → ném ApiError strapiUnreachable. Riêng lúc
 * prerender (vd. `docker compose build`: container build không tới được
 * Strapi), trước khi ném thì gọi connection() để Next hoãn trang sang
 * request-time (shell = [locale]/loading.tsx) thay vì làm build lỗi hoặc
 * nướng trang lỗi vào bản tĩnh. Ngoài prerender connection() resolve ngay
 * (request thường) hoặc throw (trong "use cache"/generateStaticParams) —
 * cả hai trường hợp đều rơi xuống throw ApiError như cũ.
 */
async function throwStrapiUnreachable(locale: Locale, defer = true): Promise<never> {
  // defer=false khi caller chạy trong "use cache" (Next cấm connection()
  // ở đó và báo lỗi build kể cả khi bắt exception).
  if (defer && typeof window === "undefined") {
    try {
      await connection();
    } catch {
      // Không ở trong request/prerender (vd. "use cache") — giữ hành vi cũ.
    }
  }
  throw new ApiError(translate(locale, "api.strapiUnreachable"), 0);
}

/** Gắn tag + revalidate nền cho fetch chạy phía server (xem StrapiListOptions.cache). */
function strapiNextOptions(
  tag: string | undefined,
  cache: StrapiCacheMode | undefined,
): { tags?: string[]; revalidate?: number } {
  const nextOpts: { tags?: string[]; revalidate?: number } = {};
  if (typeof window === "undefined" && tag) nextOpts.tags = [tag];
  if (cache === "force-cache") nextOpts.revalidate = 3600;
  return nextOpts;
}


/** Ghi tham số populate vào query. Strapi KHÔNG cho trộn 2 dạng populate
 * (chuỗi "a,b" + object "populate[x][populate]=*") trong cùng 1 request
 * (400 ValidationError) — nên khi có deepPopulate thì mọi mục đều dùng
 * dạng object: populate[a]=* và populate[blocks][populate]=*. */
function appendPopulate(params: URLSearchParams, populate?: string, deepPopulate?: string[]) {
  if (deepPopulate && deepPopulate.length > 0) {
    // Mọi mục đều dùng dạng populate[x][populate]=* — trộn với dạng
    // populate[x]=* trong cùng request cũng lỗi 400 ("Invalid key ...").
    for (const entry of (populate ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
      params.append(`populate[${entry}][populate]`, "*");
    }
    for (const c of deepPopulate) params.append(`populate[${c}][populate]`, "*");
  } else if (populate) {
    params.set("populate", populate);
  }
}

export async function strapiList<T>(
  collection: string,
  { locale, market, populate, tag, cache, pageSize, page, deepPopulate, sort }: StrapiListOptions,
): Promise<T[]> {
  if (!isStrapiConfigured()) return [];
  const params = new URLSearchParams({ locale });
  appendPopulate(params, populate, deepPopulate);
  if (market) params.set("filters[market][$eq]", market);
  if (sort) params.set("sort", sort);
  if (pageSize) params.set("pagination[pageSize]", String(pageSize));
  if (page && page > 1) params.set("pagination[page]", String(page));
  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {};
  const nextOpts = strapiNextOptions(tag, cache);
  if (Object.keys(nextOpts).length > 0) init.next = nextOpts;
  if (cache) init.cache = cache;
  let res: Response;
  try {
    res = await strapiFetch(`${strapiFetchBase()}/api/${collection}?${params}`, init, locale);
  } catch {
    return throwStrapiUnreachable(locale);
  }
  if (!res.ok) {
    throw new ApiError(translate(locale, "api.strapiError", { status: String(res.status) }), res.status);
  }
  const body = (await res.json()) as StrapiListResponse<T>;
  return body.data ?? [];
}

interface StrapiCaseStudyItem {
  title?: string;
  slug?: string;
  industry?: string;
  metricLabel?: string;
  metricValue?: number | null;
  summary?: string;
  cover?: { url?: string } | null;
}

/** URL tuyệt đối cho media Strapi (url tương đối thì ghép host Strapi). */
/** Đoạn đầu của richtext dạng string — dùng làm tóm tắt khi schema không có
 * trường summary (Article/Event). Richtext Strapi v5 validate dạng string,
 * các đoạn cách nhau bằng dòng trống. */
export function richTextExcerpt(text: string | null | undefined): string {
  if (!text) return "";
  const first = text.split(/\n\s*\n/)[0]?.trim() ?? "";
  return first.replace(/^#+\s*/, "");
}

export function strapiMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_BASE_URL}${url}`;
}

// --- Fetch theo slug / single type (R1-3) ----------------------------------

export interface StrapiSingleOptions {
  locale: Locale;
  populate?: string;
  tag?: string;
  deepPopulate?: string[];
  /** Mặc định fetch không cache (trang động đọc mới mỗi request). Đặt
   * "force-cache" khi fetch chạy trong layout/trang tĩnh — nếu không,
   * cacheComponents cấm prerender vì gặp dữ liệu không cache (lỗi build
   * ở /advertisers khi layout đọc Global). Tag vẫn cho revalidateTag
   * xóa cache khi Strapi publish (BE 8). Đặt "force-cache" thì fetch còn
   * gắn `next.revalidate = 3600` (xem StrapiListOptions.cache). */
  cache?: StrapiCacheMode;
  /** Đặt true khi gọi từ trong hàm "use cache" — Strapi không tới được
   * thì ném ApiError luôn, không hoãn prerender bằng connection(). */
  inUseCache?: boolean;
}

export async function strapiSingle<T>(
  single: string,
  { locale, populate, tag, deepPopulate, cache, inUseCache }: StrapiSingleOptions,
): Promise<T | null> {
  if (!isStrapiConfigured()) return null;
  const params = new URLSearchParams({ locale });
  appendPopulate(params, populate, deepPopulate);
  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {};
  const nextOpts = strapiNextOptions(tag, cache);
  if (Object.keys(nextOpts).length > 0) init.next = nextOpts;
  if (cache) init.cache = cache;
  let res: Response;
  try {
    res = await strapiFetch(`${strapiFetchBase()}/api/${single}?${params}`, init, locale);
  } catch {
    return throwStrapiUnreachable(locale, !inUseCache);
  }
  // Single type chưa tạo/chưa publish nội dung → Strapi 5 trả 404. Coi như
  // "chưa có nội dung" (giống collection rỗng trả []), không phải lỗi CMS —
  // trang dùng giá trị mặc định thay vì 500.
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ApiError(translate(locale, "api.strapiError", { status: String(res.status) }), res.status);
  }
  const body = (await res.json()) as { data?: T | null };
  return body.data ?? null;
}

/** Lấy 1 document của collection theo slug (lọc filters[slug][$eq]). */
export async function strapiBySlug<T>(
  collection: string,
  slug: string,
  { locale, populate, tag, cache, deepPopulate }: StrapiListOptions,
): Promise<T | null> {
  if (!isStrapiConfigured()) return null;
  const params = new URLSearchParams({ locale });
  params.set("filters[slug][$eq]", slug);
  appendPopulate(params, populate, deepPopulate);
  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {};
  const nextOpts = strapiNextOptions(tag, cache);
  if (Object.keys(nextOpts).length > 0) init.next = nextOpts;
  if (cache) init.cache = cache;
  let res: Response;
  try {
    res = await strapiFetch(`${strapiFetchBase()}/api/${collection}?${params}`, init, locale);
  } catch {
    return throwStrapiUnreachable(locale);
  }
  if (!res.ok) {
    throw new ApiError(translate(locale, "api.strapiError", { status: String(res.status) }), res.status);
  }
  const body = (await res.json()) as StrapiListResponse<T>;
  return body.data?.[0] ?? null;
}

// --- Kiểu thô của Strapi (dynamic zone giữ nguyên __component) -------------

export interface StrapiDzBlock {
  __component?: string;
  [key: string]: unknown;
}

interface StrapiProductItem {
  name?: string;
  slug?: string;
  tagline?: string;
  goal?: string;
  description?: string;
  color?: string;
  order?: number | null;
  cover?: { url?: string } | null;
  solutions?: { name?: string; slug?: string; summary?: string }[];
  blocks?: StrapiDzBlock[];
}

interface StrapiSolutionItem {
  name?: string;
  slug?: string;
  summary?: string;
  product?: { slug?: string; name?: string } | null;
  blocks?: StrapiDzBlock[];
}

interface StrapiAdFormatItem {
  name?: string;
  slug?: string;
  description?: string;
  formatType?: string;
  durationSeconds?: number | null;
  metricLabel?: string;
  metricValue?: number | null;
  solution?: { slug?: string; name?: string } | null;
}

interface StrapiResourceItem {
  title?: string;
  slug?: string;
  summary?: string;
  type?: string;
  industry?: string;
  publishedDate?: string | null;
  content?: string;
}

interface StrapiEventItem {
  title?: string;
  slug?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  mode?: string;
  location?: string;
  agenda?: { time?: string; title?: string }[];
  speakers?: { name?: string; role?: string; company?: string }[];
}

interface StrapiArticleItem {
  title?: string;
  slug?: string;
  publishedDate?: string | null;
  category?: string;
  content?: string;
}

interface StrapiJobItem {
  title?: string;
  slug?: string;
  description?: string;
  requirements?: string;
  department?: string;
  location?: string;
  type?: string;
  deadline?: string | null;
}

interface StrapiPartnerItem {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  website?: string;
  consent?: boolean;
}

interface StrapiCustomerItem {
  name?: string;
  slug?: string;
  industry?: string;
  testimonial?: string;
  consent?: boolean;
  caseStudy?: {
    slug?: string;
    title?: string;
    metricLabel?: string;
    metricValue?: number | null;
  } | null;
}

interface StrapiFaqItem {
  slug?: string;
  question?: string;
  answer?: string;
  category?: string;
  order?: number | null;
}

interface StrapiHomeItem {
  heroTitle?: string;
  heroSubtitle?: string;
  statsNote?: string;
  howItWorks?: { stepTitle?: string; stepText?: string }[];
}

interface StrapiSnapshotItem {
  snapshotDate?: string | null;
  note?: string;
  metrics?: { id?: string; value?: number; label?: string; trend?: string | null }[];
}

interface StrapiGlobalItem {
  siteName?: string;
  contactEmail?: string;
  socialLinks?: { platform?: string; url?: string }[];
}

// --- Map dynamic-zone blocks sang kiểu Block của BlockRenderer -------------
// Các block opportunity/solutions/how-to-plan/showcase KHÔNG có trường
// title trong schema Strapi — tiêu đề lấy từ i18n ở nơi gọi (titles).
// Block lạ thì bỏ qua (không render khung "chưa hỗ trợ" trên trang thật).

import type { Block } from "@/components/blocks/BlockRenderer";

export interface BlockTitles {
  opportunity?: string;
  solutions?: string;
  howToPlan?: string;
  showcase?: string;
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asItems(v: unknown): { title: string; text: string }[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    const o = it as Record<string, unknown>;
    return { title: asStr(o.title), text: asStr(o.text) };
  });
}

export function mapStrapiBlocks(dz: StrapiDzBlock[] | undefined, titles: BlockTitles = {}): Block[] {
  if (!Array.isArray(dz)) return [];
  const out: Block[] = [];
  for (const b of dz) {
    const c = b.__component ?? "";
    switch (c) {
      case "blocks.block-hero":
        out.push({
          type: "hero",
          eyebrow: asStr(b.eyebrow) || undefined,
          title: asStr(b.title),
          subtitle: asStr(b.subtitle) || undefined,
          ctaLabel: asStr(b.ctaLabel) || undefined,
          ctaHref: asStr(b.ctaHref) || undefined,
        });
        break;
      case "blocks.block-opportunity":
        out.push({ type: "opportunity", title: titles.opportunity ?? "", items: asItems(b.items) });
        break;
      case "blocks.block-solutions": {
        const items = Array.isArray(b.items)
          ? b.items.map((it) => {
              const o = it as Record<string, unknown>;
              return { name: asStr(o.name), summary: asStr(o.summary), href: asStr(o.href) || undefined };
            })
          : [];
        out.push({ type: "solutions", title: titles.solutions ?? "", solutions: items });
        break;
      }
      case "blocks.block-how-to-plan":
        out.push({ type: "how-to-plan", title: titles.howToPlan ?? "", steps: asItems(b.steps) });
        break;
      case "blocks.block-showcase": {
        const items = Array.isArray(b.items)
          ? b.items.map((it) => {
              const o = it as Record<string, unknown>;
              return { title: asStr(o.title), summary: asStr(o.summary), href: asStr(o.href) };
            })
          : [];
        out.push({ type: "showcase", title: titles.showcase ?? "", items });
        break;
      }
      case "blocks.block-lead-form":
        out.push({ type: "lead-form", title: asStr(b.title) || undefined });
        break;
      case "blocks.block-rich-text":
        out.push({ type: "rich-text", text: asStr(b.text) });
        break;
      case "blocks.block-media": {
        const file = b.file as { url?: string; alternativeText?: string } | null | undefined;
        const src = strapiMediaUrl(file?.url);
        if (src) {
          out.push({
            type: "media",
            src,
            alt: file?.alternativeText ?? asStr(b.caption),
            caption: asStr(b.caption) || undefined,
          });
        }
        break;
      }
      case "blocks.block-stats": {
        const items = Array.isArray(b.items)
          ? b.items.map((it) => {
              const o = it as Record<string, unknown>;
              return { label: asStr(o.label), value: asStr(o.value) };
            })
          : [];
        out.push({ type: "stats", items });
        break;
      }
      case "blocks.block-cta":
        out.push({
          type: "cta",
          title: asStr(b.title),
          description: asStr(b.description) || undefined,
          ctaLabel: asStr(b.ctaLabel),
          ctaHref: asStr(b.ctaHref),
        });
        break;
      default:
        if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
          console.warn(`[strapi] Bỏ qua block lạ: ${c}`);
        }
        break;
    }
  }
  return out;
}

/** Gắn tiêu đề i18n cho các block đã map (trang chi tiết gọi sau fetch,
 * vì tiêu đề theo locale của trang, không nằm trong dữ liệu Strapi). */
export function applyBlockTitles(blocks: Block[], titles: BlockTitles): Block[] {
  return blocks.map((b) => {
    if (b.type === "opportunity" && titles.opportunity) return { ...b, title: titles.opportunity };
    if (b.type === "solutions" && titles.solutions) return { ...b, title: titles.solutions };
    if (b.type === "how-to-plan" && titles.howToPlan) return { ...b, title: titles.howToPlan };
    if (b.type === "showcase" && titles.showcase) return { ...b, title: titles.showcase };
    return b;
  });
}

// --- Fetchers R1-3 ----------------------------------------------------------

import type {
  AdFormatType,
  CmsAdFormat,
  CmsArticle,
  CmsDataSnapshot,
  CmsEvent,
  CmsHome,
  CmsProduct,
  CmsResource,
  CmsSolution,
  ProductColorKey,
} from "./types";

function isProductColor(v: string | undefined): v is ProductColorKey {
  return ["location", "retail", "measurement", "insight", "network", "adsmanager"].includes(v ?? "");
}

function isAdFormatType(v: string | undefined): v is AdFormatType {
  return v === "video" || v === "banner" || v === "text";
}

export async function fetchProducts(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsProduct[]> {
  const items = await strapiList<StrapiProductItem>("products", {
    locale,
    populate: "solutions,cover",
    deepPopulate: ["blocks"],
    tag: "strapi:products",
    cache,
    pageSize: 100,
  });
  return items
    .map((item) => ({
      name: item.name ?? "",
      slug: item.slug ?? "",
      tagline: item.tagline ?? "",
      goal: item.goal ?? "",
      description: item.description ?? "",
      color: isProductColor(item.color) ? item.color : "location",
      order: item.order ?? 0,
      coverUrl: strapiMediaUrl(item.cover?.url),
      solutions: (item.solutions ?? []).map((s) => ({
        name: s.name ?? "",
        slug: s.slug ?? "",
        summary: s.summary ?? "",
      })),
      blocks: mapStrapiBlocks(item.blocks),
    }))
    .sort((a, b) => a.order - b.order);
}

export async function fetchProductBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CmsProduct | null> {
  const item = await strapiBySlug<StrapiProductItem>("products", slug, {
    locale,
    populate: "solutions,cover",
    deepPopulate: ["blocks"],
    tag: "strapi:products",
    cache,
  });
  if (!item) return null;
  return {
    name: item.name ?? "",
    slug: item.slug ?? "",
    tagline: item.tagline ?? "",
    goal: item.goal ?? "",
    description: item.description ?? "",
    color: isProductColor(item.color) ? item.color : "location",
    order: item.order ?? 0,
    coverUrl: strapiMediaUrl(item.cover?.url),
    solutions: (item.solutions ?? []).map((s) => ({
      name: s.name ?? "",
      slug: s.slug ?? "",
      summary: s.summary ?? "",
    })),
    blocks: mapStrapiBlocks(item.blocks),
  };
}

export async function fetchSolutionBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CmsSolution | null> {
  const item = await strapiBySlug<StrapiSolutionItem>("solutions", slug, {
    locale,
    populate: "product",
    deepPopulate: ["blocks"],
    tag: "strapi:solutions",
    cache,
  });
  if (!item) return null;
  return {
    name: item.name ?? "",
    slug: item.slug ?? "",
    summary: item.summary ?? "",
    productSlug: item.product?.slug ?? "",
    productName: item.product?.name ?? "",
    blocks: mapStrapiBlocks(item.blocks),
  };
}

export async function fetchSolutionsByProduct(locale: Locale, productSlug: string, cache?: StrapiCacheMode): Promise<CmsSolution[]> {
  const items = await strapiList<StrapiSolutionItem>("solutions", {
    locale,
    populate: "product",
    tag: "strapi:solutions",
    cache,
    pageSize: 100,
  });
  return items
    .filter((item) => item.product?.slug === productSlug)
    .map((item) => ({
      name: item.name ?? "",
      slug: item.slug ?? "",
      summary: item.summary ?? "",
      productSlug: item.product?.slug ?? "",
      productName: item.product?.name ?? "",
      blocks: [],
    }));
}

export async function fetchAdFormats(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsAdFormat[]> {
  const items = await strapiList<StrapiAdFormatItem>("ad-formats", {
    locale,
    populate: "solution",
    tag: "strapi:ad-formats",
    cache,
    pageSize: 100,
  });
  return items.map((item) => ({
    name: item.name ?? "",
    slug: item.slug ?? "",
    description: item.description ?? "",
    formatType: isAdFormatType(item.formatType) ? item.formatType : "video",
    durationSeconds: item.durationSeconds ?? null,
    metricLabel: item.metricLabel ?? "",
    metricValue: item.metricValue ?? null,
    solutionSlug: item.solution?.slug ?? null,
    solutionName: item.solution?.name ?? null,
  }));
}

export async function fetchResources(locale: Locale = "vi", limit = 100, sort?: string, cache?: StrapiCacheMode): Promise<CmsResource[]> {
  const items = await strapiList<StrapiResourceItem>("resources", {
    locale,
    tag: "strapi:resources",
    cache,
    pageSize: Math.min(limit, 100),
    sort,
  });
  return items.slice(0, limit).map((item) => ({
    title: item.title ?? "",
    slug: item.slug ?? "",
    summary: item.summary ?? "",
    type: item.type ?? "",
    industry: item.industry ?? null,
    publishedDate: item.publishedDate ?? null,
    content: item.content ?? "",
  }));
}

export async function fetchEvents(locale: Locale = "vi", limit = 100, sort?: string, cache?: StrapiCacheMode): Promise<CmsEvent[]> {
  const items = await strapiList<StrapiEventItem>("events", {
    locale,
    populate: "agenda,speakers",
    tag: "strapi:events",
    cache,
    pageSize: Math.min(limit, 100),
    sort,
  });
  return items.slice(0, limit).map((item) => ({
    title: item.title ?? "",
    slug: item.slug ?? "",
    summary: richTextExcerpt(item.description),
    content: item.description ?? "",
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
    mode: item.mode ?? null,
    location: item.location ?? null,
    agenda: (item.agenda ?? []).map((a) => ({ time: a.time ?? "", title: a.title ?? "" })),
    speakers: (item.speakers ?? []).map((sp) => ({
      name: sp.name ?? "",
      role: sp.role ?? "",
      company: sp.company ?? "",
    })),
  }));
}

export async function fetchArticles(locale: Locale = "vi", limit = 100, sort?: string, cache?: StrapiCacheMode): Promise<CmsArticle[]> {
  // Strapi giới hạn pageSize tối đa 100/trang — 118 bài cần đọc 2 trang.
  // Limit nhỏ (vd. showcase ở home chỉ cần 3 bài mới nhất) thì đọc đúng
  // từng đó, không đọc cả 100 rồi cắt trong bộ nhớ.
  const PAGE = Math.min(limit, 100);
  const items: StrapiArticleItem[] = [];
  for (let p = 1; items.length < limit; p++) {
    const chunk = await strapiList<StrapiArticleItem>("articles", {
      locale,
      tag: "strapi:articles",
      cache,
      pageSize: PAGE,
      page: p,
      sort,
    });
    items.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return items.slice(0, limit).map((item) => ({
    title: item.title ?? "",
    slug: item.slug ?? "",
    summary: richTextExcerpt(item.content),
    content: item.content ?? "",
    publishedDate: item.publishedDate ?? null,
    category: item.category ?? null,
  }));
}

export async function fetchHome(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsHome | null> {
  const item = await strapiSingle<StrapiHomeItem>("home", {
    locale,
    populate: "howItWorks",
    tag: "strapi:home",
    cache,
  });
  if (!item) return null;
  return {
    heroTitle: item.heroTitle ?? "",
    heroSubtitle: item.heroSubtitle ?? "",
    statsNote: item.statsNote ?? "",
    howItWorks: (item.howItWorks ?? []).map((s) => ({
      stepTitle: s.stepTitle ?? "",
      stepText: s.stepText ?? "",
    })),
  };
}

export async function fetchDataSnapshot(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsDataSnapshot | null> {
  const item = await strapiSingle<StrapiSnapshotItem>("data-snapshot", {
    locale,
    tag: "strapi:data-snapshot",
    cache,
  });
  if (!item) return null;
  return {
    snapshotDate: item.snapshotDate ?? null,
    note: item.note ?? "",
    metrics: (item.metrics ?? []).map((m) => ({
      id: m.id ?? "",
      value: m.value ?? 0,
      label: m.label ?? "",
      trend: m.trend ?? null,
    })),
  };
}

// Single Global (FE 48, SOC.01): link mạng xã hội lấy từ CMS — sửa URL
// trong Strapi là đổi luôn footer + trang Contact, không sửa code. URL
// hiện tại là giá trị seed R1 (awingvietnam) — SOC-01 chốt URL thật thì
// cập nhật trong CMS. Chưa cấu hình Strapi thì trả null, footer giữ
// nút mờ như cũ.
export async function fetchGlobal(
  locale: Locale = "vi",
  { inUseCache = false }: { inUseCache?: boolean } = {},
): Promise<CmsGlobal | null> {
  const item = await strapiSingle<StrapiGlobalItem>("global", {
    locale,
    inUseCache,
    populate: "socialLinks",
    tag: "strapi:global",
    // Layout (tĩnh) đọc Global — phải cache, nếu không build lỗi
    // prerender ở trang tĩnh (/advertisers). Revalidate bằng tag khi
    // Strapi publish (BE 8).
    cache: "force-cache",
  });
  if (!item) return null;
  return {
    siteName: item.siteName ?? "AWING",
    contactEmail: item.contactEmail ?? "",
    socialLinks: (item.socialLinks ?? [])
      .map((s) => ({ platform: s.platform ?? "", url: s.url ?? "" }))
      .filter((s) => s.platform !== "" && s.url !== ""),
  };
}

// Case study nằm trong Strapi (Plan §6), không qua FastAPI. Chưa cấu hình
// Strapi hoặc chưa có bài published thì trả danh sách rỗng — giao diện hiện
// trạng thái rỗng, không tự điền số. Locale đi qua ?locale= để nội dung
// Strapi đổi theo nút EN/VN (mặc định vi, khớp locale mặc định của Strapi).
export async function fetchCaseStudies(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CaseStudy[]> {
  const items = await strapiList<StrapiCaseStudyItem>("case-studies", {
    locale,
    populate: "cover",
    tag: "strapi:case-studies",
    cache,
  });
  return items.map((item) => {
    // Strapi v5 trả media dạng phẳng { url }; url tương đối thì ghép host Strapi.
    const rawUrl = item.cover?.url ?? null;
    const coverUrl =
      rawUrl === null
        ? null
        : rawUrl.startsWith("http")
          ? rawUrl
          : `${STRAPI_BASE_URL}${rawUrl}`;
    return {
      title: item.title ?? "",
      slug: item.slug ?? "",
      industry: item.industry ?? "",
      metricLabel: item.metricLabel ?? "",
      metricValue: item.metricValue ?? null,
      summary: item.summary ?? null,
      coverUrl,
    };
  });
}

// --- R1-4: fetchers theo slug + Jobs/Partners/Customers/FAQs ---------------

function mapEvent(item: StrapiEventItem): CmsEvent {
  return {
    title: item.title ?? "",
    slug: item.slug ?? "",
    summary: richTextExcerpt(item.description),
    content: item.description ?? "",
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
    mode: item.mode ?? null,
    location: item.location ?? null,
    agenda: (item.agenda ?? []).map((a) => ({ time: a.time ?? "", title: a.title ?? "" })),
    speakers: (item.speakers ?? []).map((sp) => ({
      name: sp.name ?? "",
      role: sp.role ?? "",
      company: sp.company ?? "",
    })),
  };
}

export async function fetchEventBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CmsEvent | null> {
  const item = await strapiBySlug<StrapiEventItem>("events", slug, {
    locale,
    populate: "agenda,speakers",
    tag: "strapi:events",
    cache,
  });
  return item ? mapEvent(item) : null;
}

export async function fetchResourceBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CmsResource | null> {
  const item = await strapiBySlug<StrapiResourceItem>("resources", slug, {
    locale,
    tag: "strapi:resources",
    cache,
  });
  if (!item) return null;
  return {
    title: item.title ?? "",
    slug: item.slug ?? "",
    summary: item.summary ?? "",
    type: item.type ?? "",
    industry: item.industry ?? null,
    publishedDate: item.publishedDate ?? null,
    content: item.content ?? "",
  };
}

export async function fetchArticleBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CmsArticle | null> {
  const item = await strapiBySlug<StrapiArticleItem>("articles", slug, {
    locale,
    tag: "strapi:articles",
    cache,
  });
  if (!item) return null;
  return {
    title: item.title ?? "",
    slug: item.slug ?? "",
    summary: richTextExcerpt(item.content),
    content: item.content ?? "",
    publishedDate: item.publishedDate ?? null,
    category: item.category ?? null,
  };
}

export async function fetchCaseStudyBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CaseStudy | null> {
  const item = await strapiBySlug<StrapiCaseStudyItem>("case-studies", slug, {
    locale,
    populate: "cover",
    tag: "strapi:case-studies",
    cache,
  });
  if (!item) return null;
  const rawUrl = item.cover?.url ?? null;
  return {
    title: item.title ?? "",
    slug: item.slug ?? "",
    industry: item.industry ?? "",
    metricLabel: item.metricLabel ?? "",
    metricValue: item.metricValue ?? null,
    summary: item.summary ?? null,
    coverUrl:
      rawUrl === null ? null : rawUrl.startsWith("http") ? rawUrl : `${STRAPI_BASE_URL}${rawUrl}`,
  };
}

export async function fetchJobs(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsJob[]> {
  const items = await strapiList<StrapiJobItem>("jobs", { locale, tag: "strapi:jobs", cache, pageSize: 100 });
  return items.map((item) => ({
    title: item.title ?? "",
    slug: item.slug ?? "",
    description: item.description ?? "",
    requirements: item.requirements ?? "",
    department: item.department ?? "",
    location: item.location ?? "",
    type: item.type ?? "",
    deadline: item.deadline ?? null,
  }));
}

export async function fetchJobBySlug(locale: Locale, slug: string, cache?: StrapiCacheMode): Promise<CmsJob | null> {
  const item = await strapiBySlug<StrapiJobItem>("jobs", slug, { locale, tag: "strapi:jobs", cache });
  if (!item) return null;
  return {
    title: item.title ?? "",
    slug: item.slug ?? "",
    description: item.description ?? "",
    requirements: item.requirements ?? "",
    department: item.department ?? "",
    location: item.location ?? "",
    type: item.type ?? "",
    deadline: item.deadline ?? null,
  };
}

export async function fetchPartners(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsPartner[]> {
  const items = await strapiList<StrapiPartnerItem>("partners", {
    locale,
    tag: "strapi:partners",
    cache,
    pageSize: 100,
  });
  return items.map((item) => ({
    name: item.name ?? "",
    slug: item.slug ?? "",
    description: item.description ?? "",
    category: item.category ?? "",
    website: item.website ?? null,
    consent: item.consent ?? false,
  }));
}

export async function fetchCustomers(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsCustomer[]> {
  const items = await strapiList<StrapiCustomerItem>("customers", {
    locale,
    populate: "caseStudy",
    tag: "strapi:customers",
    cache,
    pageSize: 100,
  });
  return items.map((item) => ({
    name: item.name ?? "",
    slug: item.slug ?? "",
    industry: item.industry ?? "",
    testimonial: item.testimonial ?? "",
    consent: item.consent ?? false,
    caseStudy: item.caseStudy
      ? {
          slug: item.caseStudy.slug ?? "",
          title: item.caseStudy.title ?? "",
          metricLabel: item.caseStudy.metricLabel ?? "",
          metricValue: item.caseStudy.metricValue ?? null,
        }
      : null,
  }));
}

export async function fetchFaqs(locale: Locale = "vi", cache?: StrapiCacheMode): Promise<CmsFaq[]> {
  const items = await strapiList<StrapiFaqItem>("faqs", { locale, tag: "strapi:faqs", cache, pageSize: 100 });
  const faqs = items.map((item) => ({
    slug: item.slug ?? "",
    question: item.question ?? "",
    answer: item.answer ?? "",
    category: item.category ?? "",
    order: item.order ?? 0,
  }));
  return faqs.sort((a, b) => a.order - b.order);
}
