// Trạng thái khóa (FE 8) — nội dung chỉ mở sau lead form / đăng nhập
// (ma trận mở khóa §6.3). CTA mặc định về trang Contact (nơi có lead form);
// trang Data ở R2 sẽ truyền href của lead form popup khi có.
"use client";

import { withLocale } from "@/lib/i18n";
import { useLocale } from "../LocaleProvider";
import Button from "../ui/Button";

interface LockedStateProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  href?: string;
}

export default function LockedState({ title, description, ctaLabel, href }: LockedStateProps) {
  const { locale, t } = useLocale();
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-muted">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="mt-3 font-semibold text-ink">{title ?? t("locked.title")}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description ?? t("locked.description")}</p>
      <Button href={href ?? withLocale("/contact", locale)} variant="primary" size="md" className="mt-4">
        {ctaLabel ?? t("locked.cta")}
      </Button>
    </div>
  );
}
