// Khung site R1-2 (FE 15-17): gom Header + lớp phủ tìm kiếm + dialog lead
// + CTA dưới mobile vào một client component để chia sẻ trạng thái mở/đóng
// (dialog lead mở được từ header, CTA mobile và các khối trên trang).
// Layout [locale] render SiteChrome thay cho Header trực tiếp.
"use client";

import { useState } from "react";
import Header from "./Header";
import LeadDialog from "./LeadDialog";
import MobileBottomBar from "./MobileBottomBar";
import SearchOverlay from "./SearchOverlay";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSource, setLeadSource] = useState("header");

  const openLead = (source: string) => {
    setLeadSource(source);
    setLeadOpen(true);
  };

  return (
    <>
      <Header onOpenSearch={() => setSearchOpen(true)} onOpenLead={openLead} />
      <div className="flex-1 pt-16 pb-16 md:pb-0">{children}</div>
      <MobileBottomBar onOpenLead={openLead} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LeadDialog open={leadOpen} source={leadSource} onClose={() => setLeadOpen(false)} />
    </>
  );
}
