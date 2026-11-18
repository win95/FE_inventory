// Tầng gọi API duy nhất của Frontend — mọi dữ liệu hiển thị đều đi qua đây.
// Hai client tách riêng theo ranh giới đã chốt (Plan §6):
//   - client nghiệp vụ: backend FastAPI + SQLite (gợi ý, số liệu, heatmap,
//     Lead/Contact, đăng nhập Google, realtime SSE);
//   - client nội dung: Strapi CMS (blog, case study, product, nội dung home).
// Không mock, không số liệu ghi cứng: backend chưa chạy hoặc kho rỗng thì
// trả về trạng thái rỗng/lỗi rõ ràng.
//
// Realtime (quyết định của tran ~12:55 +07, 18/11): backend loop-push toàn bộ
// dữ liệu, chấp nhận trễ tới 1 phút. Frontend nhận snapshot đầy đủ qua SSE;
// mất SSE thì polling lại mỗi 60 giây — không gọi dày hơn, không tự suy ra
// số liệu từ delta.
import type {
  CaseStudy,
  ContactPayload,
  CoverageResponse,
  LeadPayload,
  NetworkStats,
  SuggestResponse,
} from "./types";
import { translate, type Locale } from "./i18n";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ?? "";

export function isBackendConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

export function isStrapiConfigured(): boolean {
  return STRAPI_BASE_URL.length > 0;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  locale: Locale = "vi",
): Promise<T> {
  if (!isBackendConfigured()) {
    throw new ApiError(translate(locale, "api.noBackendConfig"), 0);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(translate(locale, "api.backendUnreachable"), 0);
  }
  if (!res.ok) {
    throw new ApiError(translate(locale, "api.backendError", { status: String(res.status) }), res.status);
  }
  return (await res.json()) as T;
}

function isEmptyList<T>(value: T[] | null | undefined): boolean {
  return !value || value.length === 0;
}

export async function fetchNetworkStats(): Promise<NetworkStats | null> {
  return requestJson<NetworkStats | null>("/api/network-stats");
}

// Locale đi kèm mọi request dữ liệu: tên tỉnh/thành backend trả theo
// locale đó (mặc định vi) để nút EN/VN đổi cả dữ liệu, không chỉ chữ cứng.
export async function fetchCoverage(locale: Locale = "vi"): Promise<CoverageResponse | null> {
  return requestJson<CoverageResponse | null>(`/api/coverage?locale=${locale}`, undefined, locale);
}

export async function fetchSuggest(
  prompt: string,
  locale: Locale = "vi",
  options: { logPrompt?: boolean } = {},
): Promise<SuggestResponse> {
  return requestJson<SuggestResponse>(
    "/api/suggest",
    {
      method: "POST",
      // Refresh số liệu realtime thì logPrompt: false để khỏi ghi trùng prompt
      // vào prompt_logs của backend (xem SuggestRequest.logPrompt).
      body: JSON.stringify({ prompt, locale, logPrompt: options.logPrompt ?? true }),
    },
    locale,
  );
}

interface StrapiCaseStudyItem {
  title?: string;
  industry?: string;
  metricLabel?: string;
  metricValue?: number | null;
  summary?: string;
  cover?: { url?: string } | null;
}

interface StrapiListResponse<T> {
  data?: T[];
}

// Case study nằm trong Strapi (Plan §6), không qua FastAPI. Chưa cấu hình
// Strapi hoặc chưa có bài published thì trả danh sách rỗng — giao diện hiện
// trạng thái rỗng, không tự điền số. Locale đi qua ?locale= để nội dung
// Strapi đổi theo nút EN/VN (mặc định vi, khớp locale mặc định của Strapi).
export async function fetchCaseStudies(locale: Locale = "vi"): Promise<CaseStudy[]> {
  if (!isStrapiConfigured()) {
    return [];
  }
  let res: Response;
  try {
    res = await fetch(`${STRAPI_BASE_URL}/api/case-studies?populate=cover&locale=${locale}`);
  } catch {
    throw new ApiError(translate(locale, "api.strapiUnreachable"), 0);
  }
  if (!res.ok) {
    throw new ApiError(translate(locale, "api.strapiError", { status: String(res.status) }), res.status);
  }
  const body = (await res.json()) as StrapiListResponse<StrapiCaseStudyItem>;
  return (body.data ?? []).map((item) => {
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

export async function submitLead(payload: LeadPayload, locale: Locale = "vi"): Promise<void> {
  await requestJson(
    "/api/leads",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    locale,
  );
}

export async function submitContact(payload: ContactPayload, locale: Locale = "vi"): Promise<void> {
  await requestJson(
    "/api/contact",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    locale,
  );
}

export function isEmptySuggest(data: SuggestResponse): boolean {
  return (
    isEmptyList(data.locations) &&
    isEmptyList(data.formats) &&
    data.overview.locations === 0 &&
    data.overview.venues === 0
  );
}

// Chu kỳ realtime đã chốt: backend loop-push full snapshot, trễ tới 1 phút
// được chấp nhận — Frontend polling dự phòng cũng đúng 60 giây, không nhanh hơn.
export const REALTIME_POLL_MS = 60_000;

// Đăng ký nhận snapshot NetworkStats đầy đủ qua SSE; mất kết nối thì tự
// chuyển sang polling 60 giây. Trả về hàm hủy đăng ký.
export function subscribeNetworkStats(
  onSnapshot: (stats: NetworkStats | null) => void,
  onError: (message: string) => void,
  locale: Locale = "vi",
): () => void {
  if (!isBackendConfigured()) {
    onError(translate(locale, "api.noBackendConfig"));
    return () => {};
  }
  let stopped = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let source: EventSource | null = null;

  const pollOnce = async () => {
    try {
      onSnapshot(await fetchNetworkStats());
    } catch (err) {
      onError(err instanceof Error ? err.message : translate(locale, "api.statsFailed"));
    }
  };
  const startPolling = () => {
    if (pollTimer !== null || stopped) return;
    void pollOnce();
    pollTimer = setInterval(() => void pollOnce(), REALTIME_POLL_MS);
  };
  const stopPolling = () => {
    if (pollTimer !== null) clearInterval(pollTimer);
    pollTimer = null;
  };

  try {
    source = new EventSource(`${API_BASE_URL}/api/events/stats`);
    source.onmessage = (event) => {
      try {
        onSnapshot(JSON.parse(event.data) as NetworkStats | null);
      } catch {
        onError(translate(locale, "api.realtimeUnreadable"));
      }
    };
    source.onerror = () => {
      source?.close();
      source = null;
      if (!stopped) startPolling();
    };
  } catch {
    startPolling();
  }

  return () => {
    stopped = true;
    stopPolling();
    source?.close();
    source = null;
  };
}
