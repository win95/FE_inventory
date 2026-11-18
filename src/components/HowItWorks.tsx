// How AWING Works — quy trình 3 bước (F05), theo đúng trang mẫu Figma:
// eyebrow + tiêu đề căn giữa (tiêu đề Barlow Condensed Black in hoa),
// thẻ trắng viền #EBEBEB, icon đỏ trên nền hồng nhạt góc trái, số thứ tự
// lớn màu xám nhạt #DADADF góc phải. Nội dung lấy đúng những gì quan sát
// được trên Figma; một số câu mô tả trên mẫu bị cắt ngắn nên không tự viết
// tiếp — chờ xin copy đầy đủ (mục 8 của Plan).
const STEPS = [
  {
    number: "01",
    title: "Mô tả chiến dịch",
    description: "Mô tả chiến dịch bằng câu thường — không cần brief hay bảng tính.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" strokeLinejoin="round" />
        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Nhận gợi ý",
    description: "Nhận gợi ý địa điểm, venue và hình thức quảng cáo dựa trên dữ liệu phủ sóng.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Chạy & đo lường",
    description: "Chạy chiến dịch và đo lường engagement, reach, conversion theo thời gian thực.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section aria-label="How AWING Works" className="bg-page">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-center text-xs font-semibold tracking-widest text-brand uppercase">How AWING Works</p>
        <h2 className="mx-auto mt-2 max-w-2xl text-center font-display text-3xl leading-[0.95] font-black tracking-tight text-ink uppercase sm:text-4xl">
          From prompt to campaign in minutes
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.number} className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tile-soft text-brand">
                  {step.icon}
                </span>
                <span className="font-display text-3xl font-black text-stepnum">{step.number}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
