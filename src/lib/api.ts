// Tầng gọi API duy nhất của Frontend — mọi dữ liệu hiển thị đều đi qua đây.
// Hai client tách riêng theo ranh giới đã chốt (Plan §6):
//   - client nghiệp vụ: backend FastAPI + SQLite (gợi ý, số liệu, heatmap,
//     Lead/Contact, đăng nhập Google, realtime SSE);
//   - client nội dung: Strapi CMS — xem src/lib/strapi.ts (blog, case study, product, nội dung home).
// Không mock, không số liệu ghi cứng: backend chưa chạy hoặc kho rỗng thì
// trả về trạng thái rỗng/lỗi rõ ràng.
//
// Realtime (quyết định của tran ~12:55 +07, 18/11): backend loop-push toàn bộ
// dữ liệu, chấp nhận trễ tới 1 phút. Frontend nhận snapshot đầy đủ qua SSE;
// mất SSE thì polling lại mỗi 60 giây — không gọi dày hơn, không tự suy ra
// số liệu từ delta.
import type {
  ContactPayload,
  CoverageResponse,
  LeadProfilePayload,
  LeadSubmitPayload,
  LeadSubmitResponse,
  NetworkStats,
  NewsletterPayload,
  OtpVerifyResponse,
  SuggestResponse,
} from "./types";
import { translate, type Locale } from "./i18n";
import { ApiError } from "./errors";

export { ApiError } from "./errors";
export { fetchCaseStudies, isStrapiConfigured, STRAPI_BASE_URL } from "./strapi";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function isBackendConfigured(): boolean {
  return API_BASE_URL.length > 0;
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
    // Backend trả lỗi thống nhất {"error": {"code", "message"}} (+ details
    // tùy endpoint, vd. OTP_WRONG kèm { attemptsLeft }) — giữ lại code để
    // giao diện xử lý theo từng loại lỗi thay vì chỉ hiện chữ chung.
    let code: string | undefined;
    let details: unknown;
    try {
      const body = (await res.clone().json()) as {
        error?: { code?: string; message?: string; details?: unknown };
      };
      code = body.error?.code;
      details = body.error?.details;
    } catch {
      // Body không phải JSON thì dùng thông báo chung bên dưới.
    }
    throw new ApiError(
      translate(locale, "api.backendError", { status: String(res.status) }),
      res.status,
      code,
      details,
    );
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

// Lead form R1-2 (LEAD-01, BE 11-14): gửi lead → backend tạo OTP gửi qua
// email (hiện giả lập — ghi log; email thật khi chốt nhà cung cấp, BE 13).
// Trả về leadId để màn OTP xác thực tiếp; đừng dùng submitLead cũ nữa.
export async function submitLeadV2(
  payload: LeadSubmitPayload,
  locale: Locale = "vi",
): Promise<LeadSubmitResponse> {
  return requestJson<LeadSubmitResponse>(
    "/api/leads",
    { method: "POST", body: JSON.stringify(payload) },
    locale,
  );
}

export async function verifyLeadOtp(
  leadId: number,
  code: string,
  locale: Locale = "vi",
): Promise<OtpVerifyResponse> {
  return requestJson<OtpVerifyResponse>(
    `/api/leads/${leadId}/verify`,
    { method: "POST", body: JSON.stringify({ code }) },
    locale,
  );
}

export async function resendLeadOtp(
  leadId: number,
  locale: Locale = "vi",
): Promise<{ sent: boolean }> {
  return requestJson<{ sent: boolean }>(
    `/api/leads/${leadId}/resend`,
    { method: "POST", body: "{}" },
    locale,
  );
}

// Bổ sung hồ sơ sau khi đã xác thực (FE 21): cần leadToken (cấp ở bước
// verify) gửi kèm Authorization — backend kiểm tra token khớp leadId.
export async function completeLeadProfile(
  leadId: number,
  leadToken: string,
  payload: LeadProfilePayload,
  locale: Locale = "vi",
): Promise<void> {
  await requestJson(
    `/api/leads/${leadId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${leadToken}` },
      body: JSON.stringify(payload),
    },
    locale,
  );
}

// Đăng ký nhận tin ở footer (FE 18). BE 17 (double opt-in) ở R1-4 — hiện
// chỉ lưu email + gửi xác nhận giả lập (ghi log), trả 202.
export async function subscribeNewsletter(
  payload: NewsletterPayload,
  locale: Locale = "vi",
): Promise<void> {
  await requestJson(
    "/api/newsletter",
    { method: "POST", body: JSON.stringify(payload) },
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
