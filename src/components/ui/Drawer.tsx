// Drawer dùng chung (FE 7) — ngăn kéo trượt từ phải (mặc định) hoặc trái,
// dùng cho menu mobile ở R1-2. Đóng bằng Escape + bấm nền, khóa cuộn body.
"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../LocaleProvider";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
}

export default function Drawer({ open, onClose, title, side = "right", children }: DrawerProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} data-testid="drawer-backdrop">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`absolute top-0 bottom-0 w-full max-w-sm bg-white p-6 outline-none transition-transform ${
          side === "right" ? "right-0" : "left-0"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-lg px-2 py-1 text-lg leading-none text-muted hover:bg-surface hover:text-ink"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
