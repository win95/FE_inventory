// Thẻ nội dung (FE 8) — Report/Paper/Case study/News/Event: ảnh cover (hoặc
// gradient giữ chỗ khi chưa có ảnh thật), badge loại, tiêu đề, mô tả, ngày.
"use client";

import Link from "next/link";

export interface ContentCardProps {
  typeLabel: string;
  title: string;
  description?: string | null;
  date?: string | null;
  imageUrl?: string | null;
  href: string;
}

export default function ContentCard({ typeLabel, title, description, date, imageUrl, href }: ContentCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white">
      <Link href={href} className="block" aria-label={title}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-36 w-full object-cover" />
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-brand/15 via-tile to-surface" aria-hidden="true" />
        )}
      </Link>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-surface px-2.5 py-1 font-semibold text-muted">{typeLabel}</span>
          {date && <span className="text-muted">{date}</span>}
        </div>
        <h3 className="mt-2 font-bold text-ink">
          <Link href={href} className="hover:text-brand">
            {title}
          </Link>
        </h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>}
      </div>
    </article>
  );
}
