// Focus trap + trả focus về nút mở — dùng chung cho Modal, Drawer (M4).
// - Tab/Shift+Tab quay vòng trong hộp thoại, không thoát ra ngoài.
// - Escape gọi onClose (Modal/Drawer tự gắn thêm xử lý riêng nếu cần).
// - Đóng xong, focus quay về phần tử đã mở hộp thoại.
// - Khóa cuộn body khi mở.
"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      // Focus đang ở khung dialog (tabIndex -1) hoặc đã thoát ra ngoài:
      // kéo về đầu/cuối danh sách thay vì để Tab đi tiếp ra ngoài.
      if (!el.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open, onClose]);

  return ref;
}
