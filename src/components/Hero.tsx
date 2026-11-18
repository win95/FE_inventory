import CampaignPromptForm from "./CampaignPromptForm";

// Hero (F02), theo đúng trang mẫu Figma: nền phẳng #F4F4F7, badge hồng nhạt
// chữ đỏ, tiêu đề Barlow Condensed Black cỡ lớn in hoa (phần nhấn màu đỏ),
// mô tả xám #6B6B80 với cụm chính in đậm đen.
// Copy theo đúng những gì quan sát được trên Figma, không bịa thêm số liệu:
// hai con số trên trang mẫu (43 triệu người dùng ở Hero và 25.4M lượt kết
// nối ở dải số liệu) đang lệch nhau nên Hero không nhắc lại con số nào —
// chờ chốt ở mục 8 của Plan.
export default function Hero() {
  return (
    <section className="bg-page">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-badge-border bg-badge-bg px-3 py-1 text-xs font-semibold tracking-widest text-brand uppercase">
          <span aria-hidden="true">✦</span> Mobile Location-Based Marketing
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-6xl leading-[1.08] font-black tracking-tight text-ink uppercase sm:text-7xl">
          Kênh marketing theo vị trí — tiếp cận người dùng{" "}
          <span className="text-brand">ngay tại địa điểm họ đang ở</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          Mô tả chiến dịch bằng câu thường, nhận gợi ý địa điểm và hình thức
          quảng cáo phù hợp, rồi <span className="font-semibold text-ink">chạy và đo lường theo thời gian thực</span>.
        </p>
        <CampaignPromptForm />
        <p className="mt-3 text-sm text-muted">
          Ví dụ: chiến dịch cà phê cao cấp tại TP. Hồ Chí Minh và Hà Nội.
        </p>
      </div>
    </section>
  );
}
