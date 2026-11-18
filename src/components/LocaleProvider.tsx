// Locale giao diện (vi/en) — dùng chung cho toàn site.
//
// Mặc định vi (khớp locale mặc định của Strapi). Locale lưu trong
// localStorage nên lần sau mở lại vẫn giữ. Đọc qua useSyncExternalStore
// (như AuthSession đọc token): server render vi, client hydrate rồi đọc
// locale đã lưu — không setState trong effect, không lệch hydration.
// Đổi locale thì lưu lại + đổi lang của <html>.
// Mọi component lấy locale qua useLocale() và dịch chữ bằng t(key).
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  parseLocale,
  translate,
  type DictKey,
  type Locale,
} from "@/lib/i18n";

const LOCALE_CHANGE_EVENT = "awing-locale-change";

function getLocaleSnapshot(): Locale {
  try {
    return parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

function subscribeLocaleChange(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
  };
}

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

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocaleChange,
    getLocaleSnapshot,
    () => DEFAULT_LOCALE,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Không lưu được thì phiên này vẫn đổi, lần sau mở lại về vi.
    }
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  };

  const t = (key: DictKey, vars?: Record<string, string>) =>
    translate(locale, key, vars);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
