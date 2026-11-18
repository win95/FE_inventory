"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ô nhập ý tưởng chiến dịch ở Hero (F02) — cũng là Search bar của Home (F14).
// Theo trang mẫu Figma: một thanh trắng duy nhất, icon tìm kiếm bên trái,
// nút đỏ "Get Suggestions" nằm BÊN TRONG thanh bên phải.
// Submit không gọi API ở đây: chuyển sang /advertisers?prompt=... để trang
// kết quả gọi API gợi ý và hiển thị trạng thái tải/lỗi/rỗng. Prompt rỗng
// không submit được.
export default function CampaignPromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    router.push(`/advertisers?prompt=${encodeURIComponent(value)}`);
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-xl border border-border bg-white p-1.5 pl-4 shadow-sm"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5 shrink-0 text-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <label htmlFor="campaign-prompt" className="sr-only">
        Nhập ý tưởng cho chiến dịch
      </label>
      <input
        id="campaign-prompt"
        type="text"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Nhập ý tưởng cho chiến dịch…"
        className="h-10 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40 sm:px-4"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M3.4 20.4 21.9 12 3.4 3.6l-.01 6.53L14.5 12 3.39 13.87l.01 6.53Z" />
        </svg>
        Get Suggestions
      </button>
    </form>
  );
}
