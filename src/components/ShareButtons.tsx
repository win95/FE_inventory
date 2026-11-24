// Nút chia sẻ bài viết (FE 34/49): sao chép link + chia sẻ X/LinkedIn/
// Facebook. Không cần SDK, chỉ mở URL chia sẻ chuẩn của từng mạng.
"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bị chặn (iframe/quyền) — người dùng vẫn copy từ thanh địa chỉ.
      setCopied(false);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const btn =
    "rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand";
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t("share.label")}>
      <span className="text-xs font-semibold text-muted">{t("share.label")}</span>
      <button type="button" onClick={copy} className={btn}>
        {copied ? t("share.copied") : t("share.copyLink")}
      </button>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={btn}>
        LinkedIn
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={btn}>
        Facebook
      </a>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className={btn}>
        X
      </a>
    </div>
  );
}
