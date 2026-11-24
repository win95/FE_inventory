// Khung site R1-2 (FE 15-17): gom Header + lớp phủ tìm kiếm + dialog lead
// + CTA dưới mobile vào một client component để chia sẻ trạng thái mở/đóng
// (dialog lead mở được từ header, CTA mobile và các khối trên trang).
// Layout [locale] render SiteChrome thay cho Header trực tiếp.
"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import LeadDialog from "./LeadDialog";
import { LeadProvider } from "./LeadContext";
import MobileBottomBar from "./MobileBottomBar";
import SearchOverlay from "./SearchOverlay";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSource, setLeadSource] = useState("header");

  // FE 45: phím tắt mở tìm kiếm — Ctrl+K (hoặc Cmd+K) mọi lúc, "/" khi
  // không đang gõ trong ô nhập.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "/") {
        const el = event.target as HTMLElement | null;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const openLead = (source: string) => {
    setLeadSource(source);
    setLeadOpen(true);
  };

  return (
    <LeadProvider value={openLead}>
      <Header onOpenSearch={() => setSearchOpen(true)} onOpenLead={openLead} />
      <div className="flex-1 pt-16 pb-16 md:pb-0">{children}</div>
      <MobileBottomBar onOpenLead={openLead} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LeadDialog open={leadOpen} source={leadSource} onClose={() => setLeadOpen(false)} />
    </LeadProvider>
  );
}
