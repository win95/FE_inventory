// Xác nhận đăng ký nhận tin (R1-4, FE 41 — đích của link trong email xác
// nhận của BE 17). Trang server gọi thẳng BE bằng token trong URL (?token=):
// token đúng → đã xác nhận; token sai/hết hạn/dùng rồi → BE trả 400 và
// trang hiện hướng dẫn đăng ký lại. Token không lộ ra client.
import type { Metadata } from "next";
import { connection } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { translate, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

// Route chặn: đọc token từ searchParams + gọi BE ở mỗi request.
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({ locale: loc, path: "/newsletter/confirm", title: `${translate(loc, "newsconfirm.title")} — AWING`, description: "" });
}

export default async function NewsletterConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection(); // Dừng prerender — đọc token từ URL ở mỗi request.
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  let state: "done" | "error" | "noToken" = "noToken";
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      state = res.ok ? "done" : "error";
    } catch {
      state = "error";
    }
  }

  return (
    <main>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-black text-ink">{translate(loc, "newsconfirm.title")}</h1>
        <p className={`mt-4 rounded-2xl border p-6 text-base leading-7 ${state === "done" ? "border-green-200 bg-green-50 text-green-900" : "border-border bg-surface text-muted"}`}>
          {state === "done" ? translate(loc, "newsconfirm.done") : state === "error" ? translate(loc, "newsconfirm.error") : translate(loc, "newsconfirm.noToken")}
        </p>
      </div>
    </main>
  );
}
