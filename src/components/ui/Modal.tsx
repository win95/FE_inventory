// Modal dùng chung (FE 7) — role=dialog, đóng bằng Escape + bấm nền,
// khóa cuộn body khi mở, focus trap + trả focus về nút mở (useFocusTrap).
// Nội dung cao hơn viewport thì cuộn được trong dialog (max-h + overflow).
// Hai modal cũ (AdvertiserAuthModal, FormatPreviewModal) đã chuyển sang
// dùng Modal này (đóng gói 24/11) để có Escape + focus trap thống nhất.
"use client";

import { useLocale } from "../LocaleProvider";
import { useFocusTrap } from "./useFocusTrap";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const { t } = useLocale();
  const dialogRef = useFocusTrap<HTMLDivElement>(open, onClose);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
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
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 outline-none"
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
