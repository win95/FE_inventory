"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL, isBackendConfigured } from "@/lib/api";
import {
  AUTH_CHANGE_EVENT,
  clearToken,
  getStoredToken,
  parseSession,
  storeToken,
} from "@/lib/auth";

// Nút đăng nhập Google + trạng thái phiên (F13, SSO).
// Đọc ?auth_token= mà backend gắn sau khi Google callback xong, lưu vào
// localStorage rồi dọn sạch khỏi URL. Phiên đọc qua useSyncExternalStore
// nên đăng nhập/đăng xuất tự cập nhật mà không cần setState trong effect.
// Đã đăng nhập thì hiện tên/email và nút Đăng xuất; chưa thì hiện nút đăng
// nhập (disable rõ ràng khi backend chưa cấu hình). Dùng useSearchParams
// nên phải nằm trong Suspense.
function subscribeAuthChange(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

function AuthSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSyncExternalStore(subscribeAuthChange, getStoredToken, () => null);
  const session = token ? parseSession(token) : null;

  useEffect(() => {
    // Token cũ hết hạn thì dọn để lần sau hiện đúng nút đăng nhập.
    const stored = getStoredToken();
    if (stored && !parseSession(stored)) {
      clearToken();
    }
    const incoming = searchParams.get("auth_token");
    if (!incoming) return;
    if (parseSession(incoming)) {
      storeToken(incoming);
    }
    // Dọn token khỏi URL để không lộ trong lịch sử / link chia sẻ.
    const url = new URL(window.location.href);
    url.searchParams.delete("auth_token");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, router]);

  if (session) {
    const initial = (session.name ?? session.email).charAt(0).toUpperCase();
    return (
      <span className="flex items-center gap-2">
        <span className="flex items-center gap-2 rounded-lg border border-outline bg-white px-2 py-1 text-sm">
          {session.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.picture} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tile text-xs font-bold text-brand">
              {initial}
            </span>
          )}
          <span className="max-w-36 truncate font-medium text-ink">
            {session.name ?? session.email}
          </span>
        </span>
        <button
          type="button"
          onClick={() => clearToken()}
          className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:text-brand"
        >
          Đăng xuất
        </button>
      </span>
    );
  }

  // Kiểu nút giống nút EN trên header theo trang mẫu Figma: bo 4px,
  // viền border, chữ muted.
  if (isBackendConfigured()) {
    return (
      <a
        href={`${API_BASE_URL}/api/auth/google`}
        className="rounded border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        Đăng nhập với Google
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      title="Đăng nhập Google do backend xác thực — backend chưa được cấu hình nên tạm thời chưa dùng được."
      className="cursor-not-allowed rounded border border-border px-2.5 py-1.5 text-sm text-muted/50"
    >
      Đăng nhập với Google
    </button>
  );
}

export default function AuthSession() {
  return (
    <Suspense
      fallback={
        <span className="rounded-lg border border-outline px-3 py-1.5 text-sm font-medium text-muted/50">
          Đăng nhập với Google
        </span>
      }
    >
      <AuthSessionInner />
    </Suspense>
  );
}
