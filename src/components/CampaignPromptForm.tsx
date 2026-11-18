"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ô nhập ý tưởng chiến dịch ở Hero (F02) — cũng là Search bar của Home (F14).
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
    <form onSubmit={submit} className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
      <label htmlFor="campaign-prompt" className="sr-only">
        Nhập ý tưởng cho chiến dịch
      </label>
      <input
        id="campaign-prompt"
        type="text"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Nhập ý tưởng cho chiến dịch…"
        className="h-12 flex-1 rounded-full border border-zinc-300 bg-white px-5 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="h-12 shrink-0 rounded-full bg-red-600 px-6 text-base font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        Get Suggestions
      </button>
    </form>
  );
}
