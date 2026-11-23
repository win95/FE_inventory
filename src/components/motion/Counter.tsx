// Counter (FE 10) — đếm số tăng dần tới giá trị đích khi cuộn tới.
// Giảm chuyển động thì nhảy thẳng tới giá trị cuối. Không dùng cho số liệu
// realtime (StatsStrip cập nhật theo SSE — đếm lại mỗi lần tick sẽ rối).
"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface CounterProps {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
}

export default function Counter({ value, format, durationMs = 800 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  // Giảm chuyển động thì giá trị khởi đầu đã là đích — không setState trong effect.
  const [display, setDisplay] = useState(() => (reduced ? value : 0));
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / durationMs);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs, reduced]);

  return <span ref={ref}>{format ? format(display) : String(display)}</span>;
}
