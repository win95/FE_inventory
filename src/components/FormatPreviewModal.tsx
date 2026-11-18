"use client";

import Link from "next/link";
import type { AdFormat } from "@/lib/types";

// Popup xem trước định dạng quảng cáo như trên Figma: khung điện thoại với
// tên format, thời lượng và chỉ số. Nút "TÌM HIỂU NGAY" trên trang mẫu bấm
// không có phản hồi nên ở đây thay bằng link Liên hệ — không để nút chết.
export default function FormatPreviewModal({
  format,
  onClose,
}: {
  format: AdFormat;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Xem trước ${format.name}`}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{format.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        <div className="mx-auto mt-4 w-48 rounded-[2rem] border-4 border-zinc-900 bg-zinc-950 p-4 text-center dark:border-zinc-700">
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Preview</p>
          <p className="mt-3 text-lg font-bold text-white">{format.name}</p>
          {format.durationSeconds !== null && format.durationSeconds !== undefined && (
            <p className="mt-1 text-sm text-zinc-300">{format.durationSeconds}s</p>
          )}
          <p className="mt-3 text-sm text-zinc-300">
            {format.metricLabel}:{" "}
            <span className="font-semibold text-white">
              {format.metricValue === null ? "—" : `${format.metricValue}%`}
            </span>
          </p>
        </div>

        <Link
          href="/contact"
          className="mt-5 block rounded-full bg-red-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
        >
          Liên hệ để triển khai →
        </Link>
      </div>
    </div>
  );
}
