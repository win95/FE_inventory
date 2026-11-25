// Proxy BFF — /api/backend/* → {BACKEND_URL}/* (FastAPI).
//
// Trình duyệt chỉ nói chuyện với Next.js; mọi gọi API nghiệp vụ từ trình
// duyệt đi qua route này, Next.js gọi FastAPI phía sau. Giữ nguyên path +
// query, chỉ bỏ tiền tố /api/backend (vd /api/backend/api/leads → {BE}/api/leads).
// Không buffer body/response: stream đi thẳng, kể cả SSE /api/events/stats.
// Không tự follow redirect (redirect: "manual") — 302 của OAuth (Google
// login) phải về tới trình duyệt để nó tự đi theo; header `location` được
// chuyển tiếp vì lý do đó.
// Chỉ chuyển tiếp header trong allowlist: không đưa host hay
// content-length sang backend. `cookie` cần cho OAuth `state` (backend đặt
// cookie oauth_state ở /api/auth/google, trình duyệt gửi lại ở callback);
// `x-forwarded-for` để backend biết IP thật khi Frontend chạy sau
// reverse proxy/CDN.
import { BACKEND_URL, isBackendConfigured } from "@/lib/backend";

const FORWARD_REQUEST_HEADERS = ["content-type", "authorization", "accept", "cookie", "x-forwarded-for"] as const;
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "content-disposition",
  "location",
  // `set-cookie` cần cho OAuth `state` (xem FORWARD_REQUEST_HEADERS).
  "set-cookie",
] as const;

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, path: string[]): Promise<Response> {
  if (!isBackendConfigured()) {
    return Response.json(
      { error: { code: "BACKEND_NOT_CONFIGURED", message: "BACKEND_URL chưa cấu hình." } },
      { status: 503 },
    );
  }
  const url = new URL(request.url);
  const target = `${BACKEND_URL}/${path.map((seg) => encodeURIComponent(seg)).join("/")}${url.search}`;
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let res: Response;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      ...(hasBody ? { duplex: "half" } : {}),
      redirect: "manual",
    } as RequestInit & { duplex?: "half" });
  } catch {
    return Response.json(
      { error: { code: "BACKEND_UNREACHABLE", message: "Không kết nối được backend." } },
      { status: 502 },
    );
  }
  const outHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = res.headers.get(name);
    if (value) outHeaders.set(name, value);
  }
  // res.body là stream (kể cả SSE) — trả thẳng, không buffer.
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

export async function GET(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}

export async function POST(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}

export async function PATCH(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}

export async function PUT(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}

export async function DELETE(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
