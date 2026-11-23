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
import { translate, type Locale } from "./i18n";
import { ApiError } from "./errors";
import type { CaseStudy } from "./types";

export const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ?? "";

export function isStrapiConfigured(): boolean {
  return STRAPI_BASE_URL.length > 0;
}

export interface StrapiListResponse<T> {
  data?: T[];
}

export interface StrapiListOptions {
  locale: Locale;
  /** Lọc theo trường market (chỉ dùng từ BE 5, khi Strapi đã có trường này). */
  market?: string;
  /** populate Strapi, vd "cover". */
  populate?: string;
  /** Tag cache cho revalidate, vd "strapi:case-studies". Chỉ có tác dụng phía server. */
  tag?: string;
}

export async function strapiList<T>(
  collection: string,
  { locale, market, populate, tag }: StrapiListOptions,
): Promise<T[]> {
  if (!isStrapiConfigured()) return [];
  const params = new URLSearchParams({ locale });
  if (populate) params.set("populate", populate);
  if (market) params.set("filters[market][$eq]", market);
  const init: RequestInit & { next?: { tags: string[] } } = {};
  if (typeof window === "undefined" && tag) init.next = { tags: [tag] };
  let res: Response;
  try {
    res = await fetch(`${STRAPI_BASE_URL}/api/${collection}?${params}`, init);
  } catch {
    throw new ApiError(translate(locale, "api.strapiUnreachable"), 0);
  }
  if (!res.ok) {
    throw new ApiError(translate(locale, "api.strapiError", { status: String(res.status) }), res.status);
  }
  const body = (await res.json()) as StrapiListResponse<T>;
  return body.data ?? [];
}

interface StrapiCaseStudyItem {
  title?: string;
  industry?: string;
  metricLabel?: string;
  metricValue?: number | null;
  summary?: string;
  cover?: { url?: string } | null;
}

// Case study nằm trong Strapi (Plan §6), không qua FastAPI. Chưa cấu hình
// Strapi hoặc chưa có bài published thì trả danh sách rỗng — giao diện hiện
// trạng thái rỗng, không tự điền số. Locale đi qua ?locale= để nội dung
// Strapi đổi theo nút EN/VN (mặc định vi, khớp locale mặc định của Strapi).
export async function fetchCaseStudies(locale: Locale = "vi"): Promise<CaseStudy[]> {
  const items = await strapiList<StrapiCaseStudyItem>("case-studies", {
    locale,
    populate: "cover",
    tag: "strapi:case-studies",
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
      industry: item.industry ?? "",
      metricLabel: item.metricLabel ?? "",
      metricValue: item.metricValue ?? null,
      summary: item.summary ?? null,
      coverUrl,
    };
  });
}
