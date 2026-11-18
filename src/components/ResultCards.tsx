import type { AdFormat, CaseStudy, SuggestedLocation } from "@/lib/types";

// Thẻ hiển thị cho trang kết quả (F06–F09): chỉ nhận dữ liệu từ API,
// không tự chứa số liệu. metricValue null thì hiển thị "—" chứ không bịa số.
//
// Theo hành vi click trên Figma (~14:03 +07, 18/11):
// - Thẻ địa điểm chỉ hiển thị, không bấm được.
// - Thẻ ad format bấm vào mở popup xem trước trên điện thoại.
// - Thẻ case study bấm vào mở popup yêu cầu tài khoản advertiser.
export function LocationCard({ location }: { location: SuggestedLocation }) {
  return (
    <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{location.name}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {location.area}, {location.city}
      </p>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        Reach:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {location.reach === null ? "—" : `${(location.reach / 1_000_000).toFixed(1)}M`}
        </span>
      </p>
    </article>
  );
}

export function AdFormatCard({
  format,
  onPreview,
}: {
  format: AdFormat;
  onPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="rounded-2xl border border-zinc-200 p-5 text-left hover:border-red-600 dark:border-zinc-800 dark:hover:border-red-500"
    >
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{format.name}</h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        {format.metricLabel}:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {format.metricValue === null ? "—" : `${format.metricValue}%`}
        </span>
      </p>
      <p className="mt-3 text-sm font-medium text-red-600">Xem trước →</p>
    </button>
  );
}

export function CaseStudyCard({
  study,
  onRequestAccess,
}: {
  study: CaseStudy;
  onRequestAccess: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRequestAccess}
      className="rounded-2xl border border-zinc-200 p-5 text-left hover:border-red-600 dark:border-zinc-800 dark:hover:border-red-500"
    >
      <p className="text-xs font-semibold tracking-widest text-red-600 uppercase">{study.industry}</p>
      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{study.title}</h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        {study.metricLabel}:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {study.metricValue === null ? "—" : `${study.metricValue}%`}
        </span>
      </p>
      <p className="mt-3 text-sm font-medium text-red-600">Xem case study đầy đủ →</p>
    </button>
  );
}
