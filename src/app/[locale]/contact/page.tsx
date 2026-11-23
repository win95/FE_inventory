"use client";

import { useState } from "react";
import { ApiError, submitContact } from "@/lib/api";
import { trackEvent } from "@/lib/tracking";
import ContactInfo from "@/components/ContactInfo";
import { useLocale } from "@/components/LocaleProvider";

// Trang Contact Us (F15), theo trang chính thức https://awing.vn/vi/contact-us
// (kiểm tra trực tiếp ngày 18/11/2026): form Loại yêu cầu / Họ tên / Email /
// SĐT / Tin nhắn + thông tin liên hệ. Gửi qua API backend, ghi vào SQLite.
// Gửi lỗi thì báo tại chỗ, không mất nội dung đã nhập.
export default function ContactPage() {
  const { locale, t } = useLocale();
  // Loại yêu cầu: giá trị gửi về backend giữ nguyên tiếng Việt (đúng mẫu
  // form chính thức của AWING), chỉ nhãn hiển thị dịch theo locale.
  const requestTypes = [
    { value: "Liên hệ quảng cáo", label: t("contactPage.typeAds") },
    { value: "Hợp tác phát triển mạng lưới", label: t("contactPage.typeNetwork") },
    { value: "Hỗ trợ người dùng & kết nối Wi-Fi", label: t("contactPage.typeSupport") },
    { value: "Khác", label: t("contactPage.typeOther") },
  ];
  const [type, setType] = useState(requestTypes[0].value);
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
      await submitContact({ type, name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }, locale);
      setStatus("sent");
      trackEvent("contact_form_submit");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : t("common.sendFailed"));
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {t("contactPage.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{t("contactPage.subtitle")}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {status === "sent" ? (
          <div className="h-fit rounded-2xl border border-green-200 bg-green-50 p-6">
            <p className="font-semibold text-green-700">{t("contactPage.sentTitle")}</p>
            <p className="mt-1 text-sm text-green-600">{t("contactPage.sentBody")}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div>
              <label htmlFor="contact-type" className="text-sm font-medium text-ink">{t("contactPage.typeLabel")}</label>
              <select id="contact-type" value={type} onChange={(e) => setType(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand">
                {requestTypes.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium text-ink">{t("form.name")}</label>
              <input id="contact-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-ink">Email *</label>
                <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand" />
              </div>
              <div>
                <label htmlFor="contact-phone" className="text-sm font-medium text-ink">{t("form.phone")}</label>
                <input id="contact-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="mt-1 h-11 w-full rounded-lg border border-outline bg-white px-3 text-ink outline-none focus:border-brand" />
              </div>
            </div>
            <div>
              <label htmlFor="contact-message" className="text-sm font-medium text-ink">{t("form.message")}</label>
              <textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5}
                className="mt-1 w-full rounded-lg border border-outline bg-white px-3 py-2 text-ink outline-none focus:border-brand" />
            </div>
            {status === "error" && <p role="alert" className="text-sm text-brand">{error}</p>}
            <button type="submit" disabled={!valid || status === "sending"}
              className="h-12 w-fit rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40">
              {status === "sending" ? t("common.sending") : t("form.send")}
            </button>
          </form>
        )}

        <aside aria-label={t("contactPage.asideTitle")}>
          <h2 className="text-lg font-semibold text-ink">{t("contactPage.asideTitle")}</h2>
          <div className="mt-4">
            <ContactInfo />
          </div>
        </aside>
      </div>
    </main>
  );
}
