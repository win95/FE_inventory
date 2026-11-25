// Thẻ nội dung (FE 8) — Report/Paper/Case study/News/Event: ảnh cover (hoặc
// gradient giữ chỗ khi chưa có ảnh thật), badge loại, tiêu đề, mô tả, ngày.
// Server component (không hook, không handler) để bớt JS client.
import Link from "next/link";
import CmsImage from "../CmsImage";

export interface ContentCardProps {
  typeLabel: string;
  title: string;
  description?: string | null;
  date?: string | null;
  imageUrl?: string | null;
  href: string;
}

export default function ContentCard({ typeLabel, title, description, date, imageUrl, href }: ContentCardProps) {
  // Một thẻ = một link duy nhất (ảnh + tiêu đề + mô tả cùng đích) thay vì
  // hai link trùng đích (ảnh riêng, tiêu đề riêng).
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white">
      <Link href={href} className="group block" aria-label={title}>
        {imageUrl ? (
          // Ảnh CMS qua next/image (CmsImage): trình duyệt lấy ảnh qua
          // /_next/image của Next.js, không gọi thẳng Strapi.
          <CmsImage src={imageUrl} alt={title} className="h-36 w-full object-cover" />
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-brand/15 via-tile to-surface" aria-hidden="true" />
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-surface px-2.5 py-1 font-semibold text-muted">{typeLabel}</span>
            {date && <span className="text-muted">{date}</span>}
          </div>
          <h3 className="mt-2 font-bold text-ink group-hover:text-brand">{title}</h3>
          {description && <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>}
        </div>
      </Link>
    </article>
  );
}
