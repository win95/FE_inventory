// Reveal (FE 10) — hiện dần khi cuộn tới (200–400ms, theo Docs §7.4).
// An toàn khi không có JS / bật giảm chuyển động: HTML trả về luôn hiện;
// chỉ khi đã mount và motion được phép mới bắt đầu ẩn rồi hiện dần.
// "mounted" đọc qua useSyncExternalStore (true ở client, false ở server)
// thay vì setState trong effect.
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface RevealProps {
  children: React.ReactNode;
  /** Thời gian chuyển động, mặc định 300ms (trong khoảng 200–400ms của tài liệu). */
  durationMs?: number;
  className?: string;
}

export default function Reveal({ children, durationMs = 300, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mounted || reduced) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, reduced]);

  const hidden = mounted && !reduced && !visible;
  return (
    <div
      ref={ref}
      style={{ transitionDuration: `${durationMs}ms` }}
      className={`transition-all ease-out ${hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
    >
      {children}
    </div>
  );
}
