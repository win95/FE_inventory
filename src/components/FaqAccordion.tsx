// Accordion FAQ (FE 44): một mục mở tại một thời điểm, dùng <button> +
// aria-expanded để bàn phím và trình đọc màn hình dùng được. Câu trả lời
// là richtext dạng string — render đoạn văn như RichText.
"use client";

import { useState } from "react";

export interface FaqItem {
  slug: string;
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.slug ?? null);
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-white">
      {items.map((item) => {
        const isOpen = open === item.slug;
        return (
          <div key={item.slug}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${item.slug}`}
                onClick={() => setOpen(isOpen ? null : item.slug)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink hover:text-brand"
              >
                {item.question}
                <span aria-hidden="true" className="shrink-0 text-xl text-muted">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            {isOpen && (
              <div id={`faq-${item.slug}`} className="space-y-3 px-5 pb-5 text-sm leading-6 text-muted">
                {item.answer.split(/\n\s*\n/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
