// Block renderer (FE 9) — render danh sách block của Strapi dynamic zone
// (PROD-02). Danh sách block chốt theo kế hoạch R1 §6 (BE 5-6): Hero,
// Opportunity, Solutions, How to plan, Showcase, Lead form, Rich text,
// Media, Stats, CTA. Mỗi block là dữ liệu có type — chưa có type nào thì
// hiện khung báo "chưa hỗ trợ" thay vì crash trang.
//
// Rich text ở đây nhận plain text (đoạn cách nhau bằng dòng trống), KHÔNG
// nhận HTML — tránh phải sanitize HTML từ CMS (FE 11). Ánh xạ JSON rich
// text của Strapi sang đoạn văn sẽ làm cùng BE 6 khi dynamic zone có thật.
"use client";

import Link from "next/link";
import CmsImage from "../CmsImage";
import LeadForm from "../LeadForm";
import { useLocale } from "../LocaleProvider";
import Button from "../ui/Button";
import { ContentCard, StatsCard } from "../content";
import type { DictKey } from "@/lib/i18n";

export type Block =
  | { type: "hero"; eyebrow?: string; title: string; subtitle?: string; ctaLabel?: string; ctaHref?: string }
  | { type: "opportunity"; title: string; items: { title: string; text: string }[] }
  | { type: "solutions"; title: string; solutions: { name: string; summary: string; href?: string }[] }
  | { type: "how-to-plan"; title: string; steps: { title: string; text: string }[] }
  | { type: "showcase"; title: string; items: { title: string; summary: string; href: string }[] }
  | { type: "lead-form"; title?: string }
  | { type: "rich-text"; text: string }
  | { type: "media"; src: string; alt: string; caption?: string }
  | { type: "stats"; items: { label: string; value: string }[] }
  | { type: "cta"; title: string; description?: string; ctaLabel: string; ctaHref: string };

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {title && <h2 className="font-display text-3xl font-black text-ink">{title}</h2>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function renderBlock(block: Block, index: number, t: (key: DictKey, vars?: Record<string, string>) => string) {
  switch (block.type) {
    case "hero":
      return (
        <section key={index} className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          {block.eyebrow && <p className="text-sm font-bold tracking-wide text-brand uppercase">{block.eyebrow}</p>}
          <h2 className="mt-2 max-w-3xl font-display text-4xl leading-[1.08] font-black text-ink uppercase sm:text-5xl">
            {block.title}
          </h2>
          {block.subtitle && <p className="mt-4 max-w-2xl text-base text-muted">{block.subtitle}</p>}
          {block.ctaLabel && block.ctaHref && (
            <Button href={block.ctaHref} size="lg" className="mt-6">
              {block.ctaLabel}
            </Button>
          )}
        </section>
      );
    case "opportunity":
      return (
        <Section key={index} title={block.title}>
          <div className="grid gap-4 md:grid-cols-3">
            {block.items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>
      );
    case "solutions":
      return (
        <Section key={index} title={block.title}>
          <div className="grid gap-4 md:grid-cols-2">
            {block.solutions.map((s) => (
              <div key={s.name} className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-bold text-ink">{s.name}</h3>
                <p className="mt-1 text-sm text-muted">{s.summary}</p>
                {s.href && (
                  <Link href={s.href} className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
                    {t("prod.viewSolution")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Section>
      );
    case "how-to-plan":
      return (
        <Section key={index} title={block.title}>
          <ol className="space-y-4">
            {block.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-2xl border border-border bg-white p-5">
                <span className="font-display text-2xl font-black text-brand">{i + 1}</span>
                <div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      );
    case "showcase":
      return (
        <Section key={index} title={block.title}>
          <div className="grid gap-4 md:grid-cols-3">
            {block.items.map((item) => (
              <ContentCard key={item.title} typeLabel="Case study" title={item.title} description={item.summary} href={item.href} />
            ))}
          </div>
        </Section>
      );
    case "lead-form":
      return (
        <div key={index}>
          <LeadForm source="product-block" />
        </div>
      );
    case "rich-text":
      return (
        <Section key={index}>
          <div className="max-w-3xl space-y-4 text-base leading-7 text-ink">
            {block.text.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Section>
      );
    case "media":
      return (
        <Section key={index}>
          <figure>
            <CmsImage src={block.src} alt={block.alt} className="w-full rounded-2xl border border-border" />
            {block.caption && <figcaption className="mt-2 text-center text-sm text-muted">{block.caption}</figcaption>}
          </figure>
        </Section>
      );
    case "stats":
      return (
        <Section key={index}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {block.items.map((item) => (
              <StatsCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </Section>
      );
    case "cta":
      return (
        <Section key={index}>
          <div className="rounded-2xl bg-brand px-6 py-10 text-center">
            <h2 className="font-display text-3xl font-black text-white">{block.title}</h2>
            {block.description && <p className="mx-auto mt-2 max-w-xl text-white/85">{block.description}</p>}
            <Button href={block.ctaHref} variant="light" size="lg" className="mt-6">
              {block.ctaLabel}
            </Button>
          </div>
        </Section>
      );
    default: {
      const unknown = block as { type: string };
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn(`[BlockRenderer] Block chưa hỗ trợ: ${unknown.type}`);
      }
      return (
        <Section key={index}>
          <div className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-muted">
            {t("docs.unknownBlock", { type: unknown.type })}
          </div>
        </Section>
      );
    }
  }
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  const { t } = useLocale();
  return <>{blocks.map((block, i) => renderBlock(block, i, t))}</>;
}
