// Locale giao diện (vi/en) — dùng chung cho toàn site.
//
// Từ R1 locale lấy từ đoạn [locale] trên URL (Docs §4.2, §8.4), không còn
// từ localStorage: layout [locale] kiểm tra locale rồi truyền xuống đây.
// Nút EN/VI chỉ đổi đoạn locale trên URL (router.replace) + ghi cookie
// awing_locale để middleware nhớ lần sau mở "/" vẫn giữ. Mọi component
// lấy locale qua useLocale() và dịch chữ bằng t(key) như trước — hợp đồng
// của hook không đổi.
"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  translate,
  type DictKey,
  type Locale,
} from "@/lib/i18n";

interface LocaleValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: DictKey, vars?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function useLocale(): LocaleValue {
  return useContext(LocaleContext);
}

export default function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    try {
      document.cookie = `${LOCALE_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Không ghi được cookie thì lần này vẫn đổi, lần sau mở "/" về vi.
    }
    const pathname = window.location.pathname;
    const segments = pathname.split("/");
    if (segments[1] === "vi" || segments[1] === "en") {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.replace(segments.join("/") + window.location.search);
  };

  const t = (key: DictKey, vars?: Record<string, string>) =>
    translate(locale, key, vars);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
