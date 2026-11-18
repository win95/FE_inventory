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
    <article className="rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-ink">{location.name}</h3>
      <p className="mt-1 text-sm text-muted">
        {location.area}, {location.city}
      </p>
      <p className="mt-3 text-sm text-muted">
        Reach:{" "}
        <span className="font-semibold text-ink">
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
      className="rounded-2xl border border-border p-5 text-left hover:border-brand"
    >
      <h3 className="font-semibold text-ink">{format.name}</h3>
      <p className="mt-3 text-sm text-muted">
        {format.metricLabel}:{" "}
        <span className="font-semibold text-brand">
          {format.metricValue === null ? "—" : `${format.metricValue}%`}
        </span>
      </p>
      <p className="mt-3 text-sm font-medium text-brand">Xem trước →</p>
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
      className="rounded-2xl border border-border p-5 text-left hover:border-brand"
    >
      <p className="text-xs font-semibold tracking-widest text-brand uppercase">{study.industry}</p>
      <h3 className="mt-2 font-semibold text-ink">{study.title}</h3>
      <p className="mt-3 text-sm text-muted">
        {study.metricLabel}:{" "}
        <span className="font-semibold text-brand">
          {study.metricValue === null ? "—" : `${study.metricValue}%`}
        </span>
      </p>
      <p className="mt-3 text-sm font-medium text-brand">Xem case study đầy đủ →</p>
    </button>
  );
}
