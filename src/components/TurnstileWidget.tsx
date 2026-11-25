// Turnstile (FE 20, Docs §6.2 + LEAD-01).
//
// Khi có NEXT_PUBLIC_TURNSTILE_SITE_KEY thì load script thật của Cloudflare
// và render widget, token trả về qua onToken. Khi chưa có key (quyết định
// #4 chưa chốt — chưa tạo tài khoản Turnstile) thì chỉ hiện dòng ghi chú
// "mô phỏng" và gọi onToken(null): backend ở chế độ giả lập sẽ chấp nhận
// (ghi log) thay vì xác minh. Không tự bịa token, không chặn form.
// Widget được remove() khi unmount (không render lại chồng lên khi remount).
"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "./LocaleProvider";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current(null);
      return;
    }
    let cancelled = false;
    let widgetId: string | undefined;
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      });
    };
    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]',
      );
      if (existing) {
        existing.addEventListener("load", render);
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.onload = render;
        document.head.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      if (widgetId !== undefined) window.turnstile?.remove?.(widgetId);
    };
  }, []);

  if (!SITE_KEY) {
    return <p className="text-xs text-muted">{t("lead.turnstileSimulated")}</p>;
  }
  return <div ref={containerRef} />;
}
