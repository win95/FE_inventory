// Trang tài liệu component (FE 7) — trang nội bộ để xem + thử mọi component
// dùng chung của R1. Không có trong sitemap, không link từ nav/header/footer.
"use client";

import { useState } from "react";
import { withLocale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import {
  Breadcrumb,
  Button,
  Drawer,
  Input,
  Modal,
  Pagination,
  Select,
  Tabs,
  toast,
} from "@/components/ui";
import {
  ContentCard,
  LockedState,
  ProductCard,
  StatsCard,
} from "@/components/content";
import BlockRenderer, { type Block } from "@/components/blocks/BlockRenderer";
import Counter from "@/components/motion/Counter";
import Reveal from "@/components/motion/Reveal";

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-10">
      <h2 className="font-display text-2xl font-black text-ink">{title}</h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export default function ComponentsDocsPage() {
  const { locale, t } = useLocale();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [industry, setIndustry] = useState("retail");

  const vi = locale === "vi";
  const sampleBlocks: Block[] = [
    {
      type: "hero",
      eyebrow: "Location-Based Channel",
      title: vi
        ? "Đúng người, đúng nơi, đúng thời điểm."
        : "The right people, in the right place, at the right moment.",
      subtitle: vi ? "Kênh quảng cáo theo vị trí trên Wi-Fi." : "Location-based channel on Wi-Fi.",
      ctaLabel: t("nav.trusted"),
      ctaHref: withLocale("/contact", locale),
    },
    {
      type: "opportunity",
      title: vi ? "Cơ hội" : "Opportunity",
      items: [
        { title: vi ? "Tiếp cận" : "Reach", text: vi ? "25,4 triệu lượt kết nối." : "25.4M connections." },
        { title: vi ? "Đo lường" : "Measurement", text: vi ? "Số liệu thật theo địa điểm." : "Real numbers by place." },
        { title: vi ? "Kích hoạt" : "Activation", text: vi ? "Ưu đãi tại điểm bán." : "Offers at the point of sale." },
      ],
    },
    {
      type: "solutions",
      title: vi ? "Giải pháp" : "Solutions",
      solutions: [
        { name: "Interactive Ad Experiences", summary: "Bumper, Banner, TVC, Interactive Card." },
        { name: "Geo-Targeted Campaigns", summary: vi ? "Nhắm theo tỉnh/thành." : "Target by province/city." },
      ],
    },
    {
      type: "how-to-plan",
      title: vi ? "Cách lập kế hoạch" : "How to plan",
      steps: [
        { title: vi ? "Chọn địa điểm" : "Pick places", text: vi ? "Chọn tỉnh/thành và chuỗi." : "Pick provinces and chains." },
        { title: vi ? "Chọn định dạng" : "Pick formats", text: "Bumper, Banner, TVC." },
        { title: vi ? "Đo lường" : "Measure", text: vi ? "Theo dõi reach và chuyển đổi." : "Track reach and conversion." },
      ],
    },
    {
      type: "showcase",
      title: "Case Studies",
      items: [
        { title: "Unilever", summary: "Nationwide Omo campaign during Tet.", href: withLocale("/advertisers", locale) },
        { title: "Grab Vietnam", summary: "2.4M new app installs.", href: withLocale("/advertisers", locale) },
      ],
    },
    { type: "lead-form" },
    {
      type: "rich-text",
      text: vi
        ? "Đoạn văn mẫu cho block rich text.\n\nĐoạn thứ hai, tách bằng dòng trống."
        : "Sample paragraph for the rich-text block.\n\nSecond paragraph, separated by a blank line.",
    },
    { type: "media", src: "/icon.svg", alt: "AWING logo", caption: vi ? "Ảnh mẫu (logo AWING)." : "Sample image (AWING logo)." },
    {
      type: "stats",
      items: [
        { label: vi ? "Lượt kết nối" : "Connections", value: "25.4M" },
        { label: vi ? "Tỉnh thành" : "Provinces", value: "63/63" },
        { label: vi ? "Chuỗi" : "Chains", value: "195+" },
        { label: vi ? "Địa điểm" : "Venues", value: "10,953" },
      ],
    },
    {
      type: "cta",
      title: vi ? "Sẵn sàng lập kế hoạch với dữ liệu thật?" : "Ready to plan with real data?",
      description: vi ? "Để lại thông tin, đội AWING liên hệ lại." : "Leave your details and the AWING team will reach out.",
      ctaLabel: t("nav.trusted"),
      ctaHref: withLocale("/contact", locale),
    },
    // Block chưa có trong danh sách hỗ trợ — phải hiện khung báo, không crash.
    { type: "video-embed" } as unknown as Block,
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Breadcrumb items={[{ label: t("footer.home"), href: withLocale("/", locale) }, { label: t("docs.title") }]} />
      <h1 className="mt-4 font-display text-4xl font-black text-ink">{t("docs.title")}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">{t("docs.subtitle")}</p>

      <DemoSection title={t("docs.base")}>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Button</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="light">Light</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="demo-name" label={vi ? "Họ tên" : "Full name"} placeholder="Nguyen Van A" hint={vi ? "Tên đầy đủ." : "Full name."} />
          <Input id="demo-email" label="Email" type="email" error="Email không hợp lệ." />
          <Select
            id="demo-industry"
            label={vi ? "Ngành" : "Industry"}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            options={[
              { value: "retail", label: "Retail" },
              { value: "fnb", label: "F&B" },
              { value: "fmcg", label: "FMCG" },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Tabs</p>
          <Tabs
            items={[
              { id: "all", label: "All" },
              { id: "news", label: "News" },
              { id: "events", label: "Events" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
            <p className="mt-2 text-sm text-muted">Tab: {tab}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Pagination</p>
          <Pagination page={page} totalPages={12} onChange={setPage} />
          <p className="mt-2 text-sm text-muted">Page: {page}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setModalOpen(true)}>Modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            Drawer
          </Button>
          <Button variant="subtle" onClick={() => toast(t("ui.toastMessage"))}>
            {t("ui.showToast")}
          </Button>
        </div>
      </DemoSection>

      <DemoSection title={t("docs.content")}>
        <div className="grid gap-4 md:grid-cols-2">
          <ProductCard
            name="Location-Based Channel"
            tagline={vi ? "Đúng người, đúng nơi, đúng thời điểm." : "The right people, in the right place, at the right moment."}
            goal={vi ? "Mục tiêu: tiếp cận" : "Goal: reach"}
            color="location"
            solutions={["Interactive Ad Experiences", "Geo-Targeted Campaigns"]}
          />
          <ProductCard
            name="Retail Media & Activation"
            tagline={vi ? "Đặt thương hiệu cạnh quyết định mua." : "Put your brand next to the buying decision."}
            goal={vi ? "Mục tiêu: chuyển đổi" : "Goal: conversion"}
            color="retail"
            solutions={["In-Store Wi-Fi Media", "Shopper Activation"]}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ContentCard typeLabel="Report" title="Vietnam Offline Attention 2026" description="How attention moves offline." date="2026-11-05" href={withLocale("/contact", locale)} />
          <ContentCard typeLabel="News" title="AWING unveils new positioning" description="Connecting Brands with Real-World Consumer Moments." date="2026-11-05" imageUrl="/icon.svg" href={withLocale("/contact", locale)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Wi-Fi logins" value="48.2M" trend={{ text: "+4.8%", direction: "up" }} />
          <StatsCard label="Ad views" value="131.7M" trend={{ text: "+3.1%", direction: "up" }} />
          <StatsCard label="Wi-Fi spots" value="18,420" trend={{ text: "-1.2%", direction: "down", good: false }} />
        </div>
        <LockedState />
      </DemoSection>

      <DemoSection title={t("docs.blocks")}>
        <p className="text-sm text-muted">{t("docs.sampleBlocks")}</p>
        <div className="rounded-2xl border border-border bg-white">
          <BlockRenderer blocks={sampleBlocks} />
        </div>
      </DemoSection>

      <DemoSection title={t("docs.motion")}>
        <Reveal>
          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="font-semibold text-ink">Reveal</p>
            <p className="mt-1 text-sm text-muted">Khối này hiện dần khi cuộn tới (300ms).</p>
          </div>
        </Reveal>
        <p className="text-sm text-muted">
          Counter: <Counter value={100} format={(n) => `${n}%`} />
        </p>
      </DemoSection>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal">
        <p className="text-sm text-muted">Đóng bằng nút ×, bấm nền, hoặc phím Escape.</p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setModalOpen(false)}>{t("common.close")}</Button>
        </div>
      </Modal>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Drawer">
        <p className="text-sm text-muted">Ngăn kéo trượt từ phải. Đóng bằng nút ×, bấm nền, hoặc phím Escape.</p>
      </Drawer>
    </main>
  );
}
