import type { AdFormat, CaseStudy, SuggestedLocation } from "@/lib/types";

// Thẻ hiển thị thuần cho trang kết quả (F06–F09): chỉ nhận dữ liệu từ API,
// không tự chứa số liệu. metricValue null thì hiển thị "—" chứ không bịa số.
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

export function AdFormatCard({ format }: { format: AdFormat }) {
  return (
    <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{format.name}</h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        {format.metricLabel}:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {format.metricValue === null ? "—" : `${format.metricValue}%`}
        </span>
      </p>
    </article>
  );
}

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <p className="text-xs font-semibold tracking-widest text-red-600 uppercase">{study.industry}</p>
      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{study.title}</h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        {study.metricLabel}:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {study.metricValue === null ? "—" : `${study.metricValue}%`}
        </span>
      </p>
    </article>
  );
}
