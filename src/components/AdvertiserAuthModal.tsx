"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import { Modal } from "./ui";

// Popup "ADVERTISER ACCOUNT REQUIRED" như trên Figma: các thao tác Share/Save,
// Drill down, tạo custom format, xem case study đầy đủ, xem chi tiết location
// đều bị chặn ở popup này. Popup chỉ mở và hiển thị form — đăng nhập bằng
// email/mật khẩu chưa được backend hỗ trợ nên submit chỉ báo rõ điều đó,
// không giả vờ đăng nhập thành công.
// Dùng Modal dùng chung (Escape + focus trap + cuộn được) thay cho overlay
// tự viết trước đây.
export default function AdvertiserAuthModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(t("modal.authNotice"));
  };

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-xs font-semibold tracking-widest text-brand uppercase">
        {t("modal.accountRequired")}
      </p>

      {/* Hai nút chuyển chế độ — chỉ là toggle, không phải tab thật nên dùng
          aria-pressed thay vì role="tab" (không có tabpanel đi kèm). */}
      <div className="mt-4 flex gap-2" aria-label={t("modal.authTabs")}>
        {(["signin", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setNotice("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              mode === m
                ? "bg-ink text-white"
                : "border border-outline text-muted hover:border-muted"
            }`}
          >
            {m === "signin" ? t("modal.signIn") : t("modal.register")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3">
        <div>
          <label htmlFor="adv-email" className="text-sm font-medium text-ink">
            {t("modal.email")}
          </label>
          <input
            id="adv-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="adv-password" className="text-sm font-medium text-ink">
            {t("modal.password")}
          </label>
          <input
            id="adv-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand"
          />
        </div>
        {notice && (
          <p role="alert" className="text-sm text-amber-700">
            {notice}
          </p>
        )}
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark"
        >
          {mode === "signin" ? t("modal.signIn") : t("modal.register")}
        </button>
      </form>
    </Modal>
  );
}
