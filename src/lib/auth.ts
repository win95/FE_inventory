// Phiên đăng nhập Google (SSO) ở phía Frontend (F13).
//
// Luồng: backend /api/auth/google chuyển tới Google, Google callback về
// backend, backend phát JWT (24h) rồi chuyển về Frontend kèm
// ?auth_token=... — component AuthSession đọc token đó, lưu vào
// localStorage và dọn sạch khỏi URL. Các request API hiện tại chưa yêu cầu
// xác thực nên token mới chỉ dùng để hiển thị trạng thái đăng nhập; khi có
// endpoint cần xác thực thì gửi kèm header Authorization: Bearer <token>.
//
// Lưu ý: giải mã payload ở đây chỉ để hiển thị (email/tên/ảnh), KHÔNG phải
// xác minh chữ ký — việc tin token là việc của backend khi nó kiểm tra JWT.

export const AUTH_TOKEN_KEY = "awing_auth_token";

// Sự kiện nội bộ: component dùng useSyncExternalStore đăng ký sự kiện này
// để tự đọc lại token khi nó đổi (đăng nhập/đăng xuất), không cần setState.
export const AUTH_CHANGE_EVENT = "awing-auth-change";

function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export interface AuthSession {
  token: string;
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  expiresAt: number | null;
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseSession(token: string): AuthSession | null {
  const payload = decodePayload(token);
  if (!payload) return null;
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!sub || !email) return null;
  const exp = typeof payload.exp === "number" ? payload.exp * 1000 : null;
  if (exp !== null && exp <= Date.now()) return null;
  return {
    token,
    sub,
    email,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    expiresAt: exp,
  };
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // localStorage không dùng được (chế độ riêng tư...) thì phiên chỉ
    // sống trong lần tải trang này — không crash trang.
  }
  notifyAuthChange();
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Bỏ qua — đã cố xóa.
  }
  notifyAuthChange();
}

export function getSession(): AuthSession | null {
  const token = getStoredToken();
  if (!token) return null;
  const session = parseSession(token);
  if (!session) {
    clearToken();
    return null;
  }
  return session;
}
