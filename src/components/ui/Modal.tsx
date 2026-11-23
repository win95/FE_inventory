// Modal dùng chung (FE 7) — role=dialog, đóng bằng Escape + bấm nền,
// khóa cuộn body khi mở, focus vào hộp thoại khi mở.
// Khác hai modal cũ (AdvertiserAuthModal, FormatPreviewModal chưa có Escape):
// trang mới từ R1-2 dùng Modal này; hai modal cũ giữ nguyên để khỏi động
// vào hành vi đã kiểm chứng, sẽ chuyển sang khi làm lại trang của chúng.
"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../LocaleProvider";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 outline-none"
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
