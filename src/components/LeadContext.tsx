// Mở dialog lead từ bất kỳ client component nào (R1-3, FE 27): các CTA
// trên trang (hero, cuối trang, trang Product) mở LeadDialog với source
// ghi lại CTA nào đã mở form. SiteChrome cung cấp context; Header và
// MobileBottomBar vẫn nhận onOpenLead qua props như trước.
"use client";

import { createContext, useContext } from "react";

const LeadContext = createContext<(source: string) => void>(() => {});

export const LeadProvider = LeadContext.Provider;

/** Mở dialog lead với source (vd. "home-hero-location-based-channel"). */
export function useOpenLead(): (source: string) => void {
  return useContext(LeadContext);
}
