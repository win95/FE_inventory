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
): Promise<T> {
  if (!isBackendConfigured()) {
    throw new ApiError("Chưa cấu hình địa chỉ backend (NEXT_PUBLIC_API_BASE_URL).", 0);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Không kết nối được tới backend. Kiểm tra backend có đang chạy không.", 0);
  }
  if (!res.ok) {
    throw new ApiError(`Backend trả lỗi ${res.status}.`, res.status);
  }
  return (await res.json()) as T;
}

function isEmptyList<T>(value: T[] | null | undefined): boolean {
  return !value || value.length === 0;
}

export async function fetchNetworkStats(): Promise<NetworkStats | null> {
  return requestJson<NetworkStats | null>("/api/network-stats");
}

export async function fetchCoverage(): Promise<CoverageResponse | null> {
  return requestJson<CoverageResponse | null>("/api/coverage");
}

export async function fetchSuggest(prompt: string): Promise<SuggestResponse> {
  return requestJson<SuggestResponse>("/api/suggest", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

interface StrapiCaseStudyItem {
  title?: string;
  industry?: string;
  metricLabel?: string;
  metricValue?: number | null;
}

interface StrapiListResponse<T> {
  data?: T[];
}

// Case study nằm trong Strapi (Plan §6), không qua FastAPI. Chưa cấu hình
// Strapi hoặc chưa có bài published thì trả danh sách rỗng — giao diện hiện
// trạng thái rỗng, không tự điền số.
export async function fetchCaseStudies(): Promise<CaseStudy[]> {
  if (!isStrapiConfigured()) {
    return [];
  }
  let res: Response;
  try {
    res = await fetch(`${STRAPI_BASE_URL}/api/case-studies?populate=cover`);
  } catch {
    throw new ApiError("Không kết nối được tới Strapi CMS. Kiểm tra Strapi có đang chạy không.", 0);
  }
  if (!res.ok) {
    throw new ApiError(`Strapi trả lỗi ${res.status}.`, res.status);
  }
  const body = (await res.json()) as StrapiListResponse<StrapiCaseStudyItem>;
  return (body.data ?? []).map((item) => ({
    title: item.title ?? "",
    industry: item.industry ?? "",
    metricLabel: item.metricLabel ?? "",
    metricValue: item.metricValue ?? null,
  }));
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  await requestJson("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitContact(payload: ContactPayload): Promise<void> {
  await requestJson("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
): () => void {
  if (!isBackendConfigured()) {
    onError("Chưa cấu hình địa chỉ backend (NEXT_PUBLIC_API_BASE_URL).");
    return () => {};
  }
  let stopped = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let source: EventSource | null = null;

  const pollOnce = async () => {
    try {
      onSnapshot(await fetchNetworkStats());
    } catch (err) {
      onError(err instanceof Error ? err.message : "Không tải được số liệu.");
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
        onError("Backend đẩy dữ liệu realtime không đọc được.");
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
