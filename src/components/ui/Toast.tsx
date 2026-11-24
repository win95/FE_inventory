// Toast dùng chung (FE 7) — gọi toast(message) ở bất cứ đâu, ToastViewport
// (gắn sẵn ở [locale]/layout.tsx) hiện thông báo 4 giây rồi tự ẩn.
// Dùng custom event thay cho provider để không phải bọc lại cây component.
"use client";

import { useEffect, useState } from "react";

const TOAST_EVENT = "awing-toast";

let toastId = 0;

export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { id: ++toastId, message } }));
}

interface ToastItem {
  id: number;
  message: string;
}

export default function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const { id, message } = (event as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev, { id, message }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 4000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (items.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <p
          key={item.id}
          role="status"
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-center text-sm text-white shadow-lg"
        >
          {item.message}
        </p>
      ))}
    </div>
  );
}
