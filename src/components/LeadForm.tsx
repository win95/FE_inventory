"use client";

import { useState } from "react";
import { ApiError, submitLead } from "@/lib/api";

// Lead form (F12). Gửi qua API backend, ghi vào SQLite — không mock.
// Trường thông tin cụ thể chốt cùng tính năng; trước mắt dùng bộ trường
// cơ bản đã có căn cứ ở form Contact Us (Họ tên / Email / SĐT / Tin nhắn).
// Gửi lỗi thì báo tại chỗ, không mất nội dung đã nhập.
export default function LeadForm() {
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
      await submitLead({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() });
      setStatus("sent");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Gửi không thành công. Thử lại sau.");
    }
  };

  if (status === "sent") {
    return (
      <section aria-label="Lead form" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/40">
          <p className="font-semibold text-green-700 dark:text-green-300">Đã nhận thông tin của bạn.</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            Chúng tôi sẽ liên hệ lại sớm. Cảm ơn bạn đã quan tâm tới AWING.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Lead form" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        Để lại thông tin — chúng tôi liên hệ lại
      </h2>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Dành cho nhà quảng cáo, chủ sở hữu Wi-Fi và đối tác muốn hợp tác.
      </p>
      <form onSubmit={submit} className="mt-6 grid max-w-2xl gap-4">
        <div>
          <label htmlFor="lead-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Họ tên *</label>
          <input id="lead-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Email *</label>
            <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
          </div>
          <div>
            <label htmlFor="lead-phone" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Số điện thoại *</label>
            <input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
              className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
          </div>
        </div>
        <div>
          <label htmlFor="lead-message" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Tin nhắn *</label>
          <textarea id="lead-message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
        </div>
        {status === "error" && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={!valid || status === "sending"}
          className="h-12 w-fit rounded-full bg-red-600 px-6 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700">
          {status === "sending" ? "Đang gửi…" : "Gửi thông tin"}
        </button>
      </form>
    </section>
  );
}
