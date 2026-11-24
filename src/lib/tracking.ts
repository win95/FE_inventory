// Tracking GA4 qua GTM (FE 12, Docs §10.2).
// - Không có NEXT_PUBLIC_GTM_ID (chưa chốt GA4/GTM — quyết định #3) thì
//   không load script GTM và trackEvent là no-op.
// - KHÔNG BAO GIỜ gửi email / SĐT / họ tên vào GA4 (Docs §10).
// Sự kiện hiện có: lead_form_submit (LeadForm), contact_form_submit (trang
// Contact). Search / prompt để R1-5.

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";

export function trackEvent(
  event: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || !GTM_ID) return;
  const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) dataLayer.push({ event, ...params });
}
