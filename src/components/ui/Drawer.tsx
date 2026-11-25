// Drawer dùng chung (FE 7) — ngăn kéo trượt từ phải (mặc định) hoặc trái,
// dùng cho menu mobile ở R1-2. Đóng bằng Escape + bấm nền, khóa cuộn body,
// focus trap + trả focus về nút mở (useFocusTrap). Panel cuộn được khi
// nội dung cao hơn viewport.
"use client";

import { useLocale } from "../LocaleProvider";
import { useFocusTrap } from "./useFocusTrap";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
}

export default function Drawer({ open, onClose, title, side = "right", children }: DrawerProps) {
  const { t } = useLocale();
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);

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
        className={`absolute top-0 bottom-0 w-full max-w-sm overflow-y-auto bg-white p-6 outline-none ${
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
