"use client";

import { useState } from "react";
import { ApiError, submitContact } from "@/lib/api";
import ContactInfo from "@/components/ContactInfo";

// Trang Contact Us (F15), theo trang chính thức https://awing.vn/vi/contact-us
// (kiểm tra trực tiếp ngày 18/11/2026): form Loại yêu cầu / Họ tên / Email /
// SĐT / Tin nhắn + thông tin liên hệ. Gửi qua API backend, ghi vào SQLite.
// Gửi lỗi thì báo tại chỗ, không mất nội dung đã nhập.
const REQUEST_TYPES = [
  "Liên hệ quảng cáo",
  "Hợp tác phát triển mạng lưới",
  "Hỗ trợ người dùng & kết nối Wi-Fi",
  "Khác",
];

export default function ContactPage() {
  const [type, setType] = useState(REQUEST_TYPES[0]);
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
      await submitContact({ type, name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() });
      setStatus("sent");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Gửi không thành công. Thử lại sau.");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        Liên hệ với chúng tôi
      </h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Cho dù bạn là nhà quảng cáo, chủ sở hữu Wi-Fi hay đối tác tiềm năng,
        chúng tôi luôn sẵn sàng trả lời các câu hỏi của bạn và khám phá các cơ
        hội hợp tác.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {status === "sent" ? (
          <div className="h-fit rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/40">
            <p className="font-semibold text-green-700 dark:text-green-300">Đã gửi tin nhắn của bạn.</p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              Chúng tôi sẽ phản hồi sớm nhất có thể. Cảm ơn bạn đã liên hệ.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div>
              <label htmlFor="contact-type" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Loại yêu cầu *</label>
              <select id="contact-type" value={type} onChange={(e) => setType(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                {REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Họ tên *</label>
              <input id="contact-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Email *</label>
                <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
              </div>
              <div>
                <label htmlFor="contact-phone" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Số điện thoại *</label>
                <input id="contact-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
              </div>
            </div>
            <div>
              <label htmlFor="contact-message" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Tin nhắn *</label>
              <textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" />
            </div>
            {status === "error" && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={!valid || status === "sending"}
              className="h-12 w-fit rounded-full bg-red-600 px-6 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700">
              {status === "sending" ? "Đang gửi…" : "Gửi"}
            </button>
          </form>
        )}

        <aside aria-label="Thông tin liên hệ">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Địa điểm &amp; liên hệ</h2>
          <div className="mt-4">
            <ContactInfo />
          </div>
        </aside>
      </div>
    </main>
  );
}
