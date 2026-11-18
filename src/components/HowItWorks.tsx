// How AWING Works — quy trình 3 bước (F05). Nội dung lấy đúng những gì quan
// sát được trên Figma; một số câu mô tả trên mẫu bị cắt ngắn nên không tự
// viết tiếp — chờ xin copy đầy đủ (mục 8 của Plan).
const STEPS = [
  {
    number: "01",
    title: "Mô tả chiến dịch",
    description: "Mô tả chiến dịch bằng câu thường — không cần brief hay bảng tính.",
  },
  {
    number: "02",
    title: "Nhận gợi ý",
    description: "Nhận gợi ý địa điểm, venue và hình thức quảng cáo dựa trên dữ liệu phủ sóng.",
  },
  {
    number: "03",
    title: "Chạy & đo lường",
    description: "Chạy chiến dịch và đo lường engagement, reach, conversion theo thời gian thực.",
  },
];

export default function HowItWorks() {
  return (
    <section aria-label="How AWING Works" className="border-y border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          How AWING Works
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.number} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-bold tracking-widest text-red-600">{step.number}</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
