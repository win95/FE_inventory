import CampaignPromptForm from "./CampaignPromptForm";

// Hero (F02). Copy theo đúng những gì quan sát được trên Figma, không bịa
// thêm số liệu: hai con số trên trang mẫu (43 triệu người dùng ở Hero và
// 25.4M lượt kết nối ở dải số liệu) đang lệch nhau nên Hero không nhắc lại
// con số nào — chờ chốt ở mục 8 của Plan.
export default function Hero() {
  return (
    <section className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold tracking-widest text-red-600 uppercase">
          Mobile Location-Based Marketing
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Kênh marketing theo vị trí — tiếp cận người dùng{" "}
          <span className="text-red-600">ngay tại địa điểm họ đang ở</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Mô tả chiến dịch bằng câu thường, nhận gợi ý địa điểm và hình thức
          quảng cáo phù hợp, rồi chạy và đo lường theo thời gian thực.
        </p>
        <CampaignPromptForm />
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Ví dụ: chiến dịch cà phê cao cấp tại TP. Hồ Chí Minh và Hà Nội.
        </p>
      </div>
    </section>
  );
}
