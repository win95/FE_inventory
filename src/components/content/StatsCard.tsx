// Thẻ số liệu (FE 8) — nhãn + giá trị lớn + xu hướng (tăng/giảm, tốt/xấu).
// Server component (không hook, không handler) để bớt JS client.
import type { ReactNode } from "react";

export interface StatsCardProps {
  label: string;
  value: string;
  trend?: { text: string; direction: "up" | "down"; good?: boolean };
  icon?: ReactNode;
  hint?: string;
}

export default function StatsCard({ label, value, trend, icon, hint }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {icon && <span className="text-brand" aria-hidden="true">{icon}</span>}
      </div>
      <p className="mt-1 font-display text-2xl font-black text-ink">{value}</p>
      {trend && (
        <p className={`mt-1 text-xs font-semibold ${trend.good === false ? "text-brand" : "text-p-insight-dark"}`}>
          {trend.direction === "up" ? "▲" : "▼"} {trend.text}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
