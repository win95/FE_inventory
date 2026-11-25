"use client";

import Link from "next/link";
import type { AdFormat } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import { withLocale } from "@/lib/i18n";
import { Modal } from "./ui";


// Popup xem trước định dạng quảng cáo như trên Figma: khung điện thoại với
// tên format, thời lượng và chỉ số. Nút "TÌM HIỂU NGAY" trên trang mẫu bấm
// không có phản hồi nên ở đây thay bằng link Liên hệ — không để nút chết.
// Dùng Modal dùng chung (Escape + focus trap + cuộn được) thay cho overlay
// tự viết trước đây.
export default function FormatPreviewModal({
  format,
  onClose,
}: {
  format: AdFormat;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  return (
    <Modal open onClose={onClose} title={format.name}>
      <div className="mx-auto mt-4 w-48 rounded-[2rem] border-4 border-ink bg-ink p-4 text-center">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">{t("modal.preview")}</p>
        <p className="mt-3 text-lg font-bold text-white">{format.name}</p>
        {format.durationSeconds !== null && format.durationSeconds !== undefined && (
          <p className="mt-1 text-sm text-white/70">{format.durationSeconds}s</p>
        )}
        <p className="mt-3 text-sm text-white/70">
          {format.metricLabel}:{" "}
          <span className="font-semibold text-white">
            {format.metricValue === null ? "—" : `${format.metricValue}%`}
          </span>
        </p>
      </div>

      <Link
        href={withLocale("/contact", locale)}
        className="mt-5 block rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {t("modal.contactCta")}
      </Link>
    </Modal>
  );
}
