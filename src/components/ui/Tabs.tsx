// Tabs dùng chung (FE 7) — role=tablist/tab, phím mũi tên trái/phải đổi tab.
"use client";

import { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export default function Tabs({ items, value, onChange, ariaLabel }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  // FE 52: cuộn ngang trên mobile — 6 tab sản phẩm không vừa 360px, không
  // được để tràn trang. Người dùng vuốt ngang để xem tab còn lại.
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1.5 overflow-x-auto pb-1">
      {items.map((item, i) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors ${
              active ? "bg-brand font-semibold text-white" : "bg-surface text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
