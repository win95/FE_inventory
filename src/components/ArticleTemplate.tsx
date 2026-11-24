// Mẫu bài viết T.Article (FE 34): dùng chung cho Resource, News, Case study
// (và trang pháp lý ở dạng rút gọn). Header (nhãn loại, tiêu đề, ngày, chia
// sẻ) + mục lục tự động (chỉ hiện khi nội dung có tiêu đề "## ") + nội dung
// + khối liên quan (truyền qua children) + JSON-LD (Article/NewsArticle)
// do trang gọi truyền vào.
import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb } from "./ui";
import RichText, { extractHeadings } from "./RichText";
import ShareButtons from "./ShareButtons";
import { withLocale, type Locale } from "@/lib/i18n";

interface ArticleTemplateProps {
  locale: Locale;
  eyebrow: string;
  title: string;
  meta: string | null;
  shareUrl: string;
  content: string;
  breadcrumb: { label: string; href?: string }[];
  backHref: string;
  backLabel: string;
  jsonLd: Record<string, unknown>;
  relatedTitle?: string;
  children?: ReactNode;
}

export default function ArticleTemplate({
  locale,
  eyebrow,
  title,
  meta,
  shareUrl,
  content,
  breadcrumb,
  backHref,
  backLabel,
  jsonLd,
  relatedTitle,
  children,
}: ArticleTemplateProps) {
  const headings = extractHeadings(content);
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumb items={breadcrumb} />
        <article className="mx-auto max-w-3xl py-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-ink sm:text-4xl">{title}</h1>
          {meta && <p className="mt-3 text-sm text-muted">{meta}</p>}
          <div className="mt-5">
            <ShareButtons title={title} url={shareUrl} />
          </div>
          {headings.length > 0 && (
            <nav aria-label="Table of contents" className="mt-8 rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-ink">Nội dung</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {headings.map((h) => (
                  <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                    <a href={`#${h.id}`} className="text-muted hover:text-brand">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="mt-8">
            <RichText text={content} />
          </div>
        </article>
        {children && (
          <section className="border-t border-border py-10">
            {relatedTitle && <h2 className="font-display text-2xl font-bold text-ink">{relatedTitle}</h2>}
            <div className="mt-6">{children}</div>
          </section>
        )}
        <div className="pb-12">
          <Link href={withLocale(backHref, locale)} className="text-sm font-medium text-brand hover:underline">
            ← {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
