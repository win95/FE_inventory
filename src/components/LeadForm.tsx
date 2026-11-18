"use client";

import { useState } from "react";
import { ApiError, submitLead } from "@/lib/api";
import { useLocale } from "./LocaleProvider";

// Lead form (F12). Gửi qua API backend, ghi vào SQLite — không mock.
// Trường thông tin cụ thể chốt cùng tính năng; trước mắt dùng bộ trường
// cơ bản đã có căn cứ ở form Contact Us (Họ tên / Email / SĐT / Tin nhắn).
// Gửi lỗi thì báo tại chỗ, không mất nội dung đã nhập.
export default function LeadForm() {
  const { locale, t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const valid = name.trim() && email.trim() && phone.trim() && message.trim();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setStatus("sending");
    setError("");
    try {
      await submitLead({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }, locale);
      setStatus("sent");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : t("common.sendFailed"));
    }
  };

  if (status === "sent") {
    return (
      <section aria-label="Lead form" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="font-semibold text-green-700">{t("lead.sentTitle")}</p>
          <p className="mt-1 text-sm text-green-600">{t("lead.sentBody")}</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Lead form" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {t("lead.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted">{t("lead.subtitle")}</p>
      <form onSubmit={submit} className="mt-6 grid max-w-2xl gap-4">
        <div>
          <label htmlFor="lead-name" className="text-sm font-medium text-ink">{t("form.name")}</label>
          <input id="lead-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-email" className="text-sm font-medium text-ink">Email *</label>
            <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand" />
          </div>
          <div>
          <label htmlFor="lead-phone" className="text-sm font-medium text-ink">{t("form.phone")}</label>
            <input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
              className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand" />
          </div>
        </div>
        <div>
          <label htmlFor="lead-message" className="text-sm font-medium text-ink">{t("form.message")}</label>
          <textarea id="lead-message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4}
            className="mt-1 w-full rounded-lg border border-outline bg-white px-3 py-2 text-ink outline-none focus:border-brand" />
        </div>
        {status === "error" && <p role="alert" className="text-sm text-brand">{error}</p>}
        <button type="submit" disabled={!valid || status === "sending"}
          className="h-12 w-fit rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40">
          {status === "sending" ? t("common.sending") : t("form.sendLead")}
        </button>
      </form>
    </section>
  );
}
