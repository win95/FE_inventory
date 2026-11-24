// Form nộp CV (FE 43, BE 16): họ tên + email + điện thoại + thư ngỏ +
// file CV (PDF/DOCX, ≤ 5 MB) + đồng ý xử lý dữ liệu. File kiểm tra ngay
// trên trình duyệt (đuôi + magic bytes + dung lượng) trước khi gửi
// multipart tới BE; BE lưu file, quét virus giả lập (R1) và báo HR qua outbox.
"use client";

import { useState } from "react";
import { applyJob } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { useLocale } from "./LocaleProvider";
import { Button, Input } from "./ui";

const MAX_BYTES = 5 * 1024 * 1024;

export default function CvApplicationForm({ slug }: { slug: string }) {
  const { locale, t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const checkFile = async (f: File): Promise<string | null> => {
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) return t("jobs.cvTypeError");
    if (f.size > MAX_BYTES) return t("jobs.cvSizeError");
    const head = new Uint8Array(await f.slice(0, 4).arrayBuffer());
    const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
    const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04; // PK\x03\x04
    if (!isPdf && !isZip) return t("jobs.cvTypeError");
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !file || !consent) {
      setState("error");
      setMessage(t("jobs.cvInvalid"));
      return;
    }
    const fileError = await checkFile(file);
    if (fileError) {
      setState("error");
      setMessage(fileError);
      return;
    }
    setState("sending");
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("email", email.trim());
    fd.append("phone", phone.trim());
    fd.append("coverNote", coverNote.trim());
    fd.append("consent", "true");
    fd.append("locale", locale);
    fd.append("file", file);
    try {
      await applyJob(slug, fd, locale);
      setState("done");
    } catch (err: unknown) {
      setState("error");
      setMessage(err instanceof ApiError ? err.message : t("jobs.cvError"));
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="font-semibold text-ink">{t("jobs.cvDone")}</p>
        <p className="mt-1 text-sm text-muted">{t("jobs.cvDoneNote")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-xl font-bold text-ink">{t("jobs.applyTitle")}</h2>
      <Input id="cv-name" label={t("form.name")} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      <Input id="cv-email" type="email" label={t("form.email")} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <Input id="cv-phone" type="tel" label={t("form.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      <div>
        <label htmlFor="cv-note" className="mb-1 block text-sm font-medium text-ink">
          {t("jobs.coverNote")}
        </label>
        <textarea
          id="cv-note"
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="cv-file" className="mb-1 block text-sm font-medium text-ink">
          {t("jobs.cvFile")} (PDF/DOCX, ≤ 5 MB)
        </label>
        <input
          id="cv-file"
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-ink file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        {file && <p className="mt-1 text-xs text-muted">{file.name}</p>}
      </div>
      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        {t("jobs.cvConsent")}
      </label>
      {state === "error" && (
        <p role="alert" className="text-sm text-brand">
          {message}
        </p>
      )}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? t("common.sending") : t("jobs.applySubmit")}
      </Button>
    </form>
  );
}
