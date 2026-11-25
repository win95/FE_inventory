// Form đăng ký sự kiện (FE 36, BE 15): tên + email + điện thoại + đồng ý
// nhận thông tin. Đăng ký trùng email trong 24h trả duplicate (không lỗi).
// Sau khi đăng ký xong, nút "Thêm vào lịch" tải file .ics tạo ngay trên
// trình duyệt từ giờ bắt đầu/kết thúc của sự kiện (BE cũng gửi .ics kèm
// email xác nhận giả lập).
"use client";

import { useState } from "react";
import { registerEvent } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { useLocale } from "./LocaleProvider";
import { Button, Input } from "./ui";

function toIcsDate(iso: string | null): string {
  if (!iso) return "";
  // Date-only (vd "2026-11-25") → nửa đêm UTC; datetime giữ nguyên.
  const v = iso.includes("T") ? iso : `${iso}T00:00:00Z`;
  return v.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// TEXT trong .ics theo RFC 5545: escape \, ; , và xuống dòng.
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n");
}

export default function EventRegistrationForm({
  slug,
  title,
  startDate,
  endDate,
}: {
  slug: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const { locale, t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const downloadIcs = () => {
    const dtStart = toIcsDate(startDate);
    const dtEnd = toIcsDate(endDate);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AWING//Event//EN",
      "BEGIN:VEVENT",
      `UID:${slug}@awing.vn`,
      // DTSTAMP bắt buộc theo RFC 5545 (file cũ thiếu nên một số lịch từ chối).
      `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd || dtStart}`,
      `SUMMARY:${escapeIcsText(title)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !consent) {
      setState("error");
      setMessage(t("event.registerInvalid"));
      return;
    }
    setState("sending");
    try {
      await registerEvent(slug, { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, consent: true, locale }, locale);
      setState("done");
    } catch (err: unknown) {
      setState("error");
      setMessage(err instanceof ApiError ? err.message : t("event.registerError"));
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="font-semibold text-ink">{t("event.registerDone")}</p>
        <p className="mt-1 text-sm text-muted">{t("event.registerDoneNote")}</p>
        {startDate && (
          <Button type="button" variant="outline" className="mt-4" onClick={downloadIcs}>
            {t("event.addToCalendar")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-xl font-bold text-ink">{t("event.registerTitle")}</h2>
      <Input id="event-name" label={t("form.name")} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      <Input id="event-email" type="email" label={t("form.email")} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <Input id="event-phone" type="tel" label={t("form.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        {t("event.registerConsent")}
      </label>
      {state === "error" && (
        <p role="alert" className="text-sm text-brand">
          {message}
        </p>
      )}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? t("common.sending") : t("event.registerSubmit")}
      </Button>
    </form>
  );
}
