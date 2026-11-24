// Lead form dùng chung (FE 19-21, LEAD-01, Docs §6.2).
//
// Hai chế độ: "embedded" (trang Home, block lead-form trong Product) và
// "popup" (dialog Get data — Modal bọc ngoài, tiêu đề do Modal giữ).
// Luồng 3 bước: nhập thông tin → xác thực OTP qua email → bổ sung hồ sơ.
// - Bắt buộc: họ tên, công ty, email công việc, SĐT (E.164 — gõ 0xxx thì
//   tự đổi sang +84...); tùy chọn: ngành, thương hiệu, khu vực, ghi chú.
// - Đồng ý tách 2 mục đích: liên hệ (bắt buộc) / nhận tin (tùy chọn).
// - Email cá nhân (gmail, yahoo...) chỉ cảnh báo, không chặn.
// - Turnstile: có key thì widget thật, chưa có key thì ghi "mô phỏng" và
//   backend chấp nhận ở chế độ giả lập (ghi log) — xem TurnstileWidget.
// - UTM đọc từ URL lúc submit; source = CTA đã mở form (header, home...).
// - Gửi lỗi thì báo tại chỗ, không mất nội dung đã nhập.
"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  API_BASE_URL,
  completeLeadProfile,
  isBackendConfigured,
  resendLeadOtp,
  submitLeadV2,
  verifyLeadOtp,
} from "@/lib/api";
import { trackEvent } from "@/lib/tracking";
import { useLocale } from "./LocaleProvider";
import { Input, Select } from "./ui";
import TurnstileWidget from "./TurnstileWidget";

const INDUSTRIES = ["Retail", "F&B", "FMCG", "Finance", "Healthcare", "Automotive"];
const REGIONS = ["TP.HCM", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương"];
const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
]);

const E164_RE = /^\+[1-9]\d{7,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "0901234567" → "+84901234567"; "84901234567" → "+84901234567". */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s.()-]/g, "");
  if (/^0\d{8,9}$/.test(digits)) return `+84${digits.slice(1)}`;
  if (/^84\d{9,10}$/.test(digits)) return `+${digits}`;
  return digits;
}

function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return utm;
}

interface LeadFormProps {
  mode?: "embedded" | "popup";
  source?: string;
  onDone?: () => void;
}

export default function LeadForm({ mode = "embedded", source = "home", onDone }: LeadFormProps) {
  const { locale, t } = useLocale();
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  // Tiền tố id riêng theo chế độ: trang Home cũng render LeadForm nhúng
  // nên dialog popup phải dùng id khác, không trùng id trên trang.
  const idp = mode === "popup" ? "lead-popup-" : "lead-";

  // Bước 1 — thông tin lead.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [brand, setBrand] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [consentContact, setConsentContact] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState("");
  const [sending, setSending] = useState(false);

  // Bước 2 — OTP.
  const [leadId, setLeadId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [leadToken, setLeadToken] = useState<string | null>(null);

  // Bước 3 — bổ sung hồ sơ.
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const personalEmail = PERSONAL_DOMAINS.has(emailDomain);

  const toggleRegion = (region: string) =>
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!name.trim() || !company.trim()) {
      setFieldError(t("common.sendFailed"));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError(t("lead.emailInvalid"));
      return;
    }
    if (!E164_RE.test(normalizedPhone)) {
      setFieldError(t("lead.phoneInvalid"));
      return;
    }
    if (!consentContact) {
      setFieldError(t("lead.consentRequired"));
      return;
    }
    setFieldError("");
    setSending(true);
    try {
      const res = await submitLeadV2(
        {
          name: name.trim(),
          email: email.trim(),
          phone: normalizedPhone,
          company: company.trim(),
          industry: industry || undefined,
          brand: brand.trim() || undefined,
          regions: regions.length > 0 ? regions : undefined,
          notes: notes.trim() || undefined,
          consentContact,
          consentMarketing,
          turnstileToken,
          utm: readUtm(),
          source,
          language: locale,
          market: "vn",
        },
        locale,
      );
      setLeadId(res.leadId);
      setStep("otp");
      trackEvent("lead_form_submit", { source });
    } catch (err: unknown) {
      setFieldError(err instanceof ApiError ? err.message : t("common.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const submitOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (leadId === null || code.trim().length !== 6) return;
    setOtpError("");
    setVerifying(true);
    try {
      const res = await verifyLeadOtp(leadId, code.trim(), locale);
      setLeadToken(res.leadToken);
      setStep("done");
      trackEvent("lead_verified", { source });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "OTP_WRONG") {
        const left = (err.details as { attemptsLeft?: number } | undefined)?.attemptsLeft;
        setOtpError(
          typeof left === "number"
            ? t("lead.otpWrong", { n: String(left) })
            : t("common.sendFailed"),
        );
      } else if (err instanceof ApiError && err.code === "OTP_EXPIRED") {
        setOtpError(t("lead.otpExpired"));
      } else {
        setOtpError(err instanceof ApiError ? err.message : t("common.sendFailed"));
      }
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (leadId === null || resendCooldown > 0) return;
    setOtpError("");
    try {
      await resendLeadOtp(leadId, locale);
      setResendCooldown(60);
    } catch (err: unknown) {
      setOtpError(err instanceof ApiError ? err.message : t("common.sendFailed"));
    }
  };

  // Các trường tùy chọn còn trống sau bước 1 — chỉ hiện những trường này ở bước 3.
  const missingOptional = [
    industry ? null : "industry",
    brand.trim() ? null : "brand",
    regions.length > 0 ? null : "regions",
    notes.trim() ? null : "notes",
  ].filter((x): x is string => x !== null);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (leadId === null || !leadToken) return;
    setSavingProfile(true);
    try {
      await completeLeadProfile(
        leadId,
        leadToken,
        {
          industry: industry || undefined,
          brand: brand.trim() || undefined,
          regions: regions.length > 0 ? regions : undefined,
          notes: notes.trim() || undefined,
          consentMarketing,
        },
        locale,
      );
      setProfileSaved(true);
      trackEvent("lead_profile_completed", { source });
    } catch (err: unknown) {
      setFieldError(err instanceof ApiError ? err.message : t("common.sendFailed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const formBody = (
    <form onSubmit={submitForm} className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${idp}name`}
          label={t("form.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          id={`${idp}company`}
          label={t("lead.company")}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          autoComplete="organization"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${idp}email`}
          label="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          hint={personalEmail ? t("lead.personalEmail") : undefined}
        />
        <Input
          id={`${idp}phone`}
          label={t("form.phone")}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
          placeholder="+84 901 234 567"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id={`${idp}industry`}
          label={t("lead.industry")}
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          options={[
            { value: "", label: t("lead.industryPlaceholder") },
            ...INDUSTRIES.map((ind) => ({ value: ind, label: ind })),
          ]}
        />
        <Input
          id={`${idp}brand`}
          label={t("lead.brand")}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div>
        <p className="mb-1 block text-sm font-medium text-ink">{t("lead.regions")}</p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => {
            const active = regions.includes(region);
            return (
              <button
                key={region}
                type="button"
                aria-pressed={active}
                onClick={() => toggleRegion(region)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-muted hover:text-ink"
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor={`${idp}notes`} className="mb-1 block text-sm font-medium text-ink">
          {t("lead.notes")}
        </label>
        <textarea
          id={`${idp}notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t("lead.notesPlaceholder")}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={consentContact}
            onChange={(e) => setConsentContact(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#d2232a]"
          />
          {t("lead.consentContact")} *
        </label>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={consentMarketing}
            onChange={(e) => setConsentMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#d2232a]"
          />
          {t("lead.consentMarketing")}
        </label>
      </div>
      <TurnstileWidget onToken={setTurnstileToken} />
      {fieldError && (
        <p role="alert" className="text-sm text-brand">
          {fieldError}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="h-12 w-fit rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40"
      >
        {sending ? t("lead.otpSending") : t("lead.submitAndVerify")}
      </button>
    </form>
  );

  const otpBody = (
    <form onSubmit={submitOtp} className="mt-6 grid gap-4">
      <p className="text-lg font-bold text-ink">{t("lead.otpTitle")}</p>
      <p className="text-sm text-muted">{t("lead.otpHint", { email })}</p>
      <Input
        id={`${idp}otp`}
        label={t("lead.otpLabel")}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
      />
      {otpError && (
        <p role="alert" className="text-sm text-brand">
          {otpError}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="h-11 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40"
        >
          {verifying ? t("common.sending") : t("lead.otpVerify")}
        </button>
        <button
          type="button"
          onClick={resendCode}
          disabled={resendCooldown > 0}
          className="h-11 rounded-lg border border-border px-4 text-sm text-muted hover:text-ink disabled:cursor-not-allowed disabled:text-muted/50"
        >
          {resendCooldown > 0
            ? t("lead.otpResendWait", { n: String(resendCooldown) })
            : t("lead.otpResend")}
        </button>
      </div>
    </form>
  );

  const doneBody = (
    <div className="mt-6 grid gap-4">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="font-semibold text-green-700">{t("lead.verifiedTitle")}</p>
        <p className="mt-1 text-sm text-green-600">{t("lead.verifiedBody")}</p>
      </div>
      {profileSaved ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-ink">{t("lead.profileSaved")}</p>
          {mode === "popup" && onDone && (
            <button
              type="button"
              onClick={onDone}
              className="h-11 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark"
            >
              {t("common.close")}
            </button>
          )}
        </div>
      ) : missingOptional.length > 0 ? (
        <form onSubmit={saveProfile} className="grid gap-4">
          <p className="text-sm font-medium text-ink">{t("lead.completeTitle")}</p>
          <p className="text-sm text-muted">{t("lead.completeBody")}</p>
          {missingOptional.includes("industry") && (
            <Select
              id={`${idp}profile-industry`}
              label={t("lead.industry")}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={[
                { value: "", label: t("lead.industryPlaceholder") },
                ...INDUSTRIES.map((ind) => ({ value: ind, label: ind })),
              ]}
            />
          )}
          {missingOptional.includes("brand") && (
            <Input
              id={`${idp}profile-brand`}
              label={t("lead.brand")}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              autoComplete="off"
            />
          )}
          {missingOptional.includes("regions") && (
            <div>
              <p className="mb-1 block text-sm font-medium text-ink">{t("lead.regions")}</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => {
                  const active = regions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleRegion(region)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-brand bg-brand text-white"
                          : "border-border bg-white text-muted hover:text-ink"
                      }`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {missingOptional.includes("notes") && (
            <div>
              <label htmlFor={`${idp}profile-notes`} className="mb-1 block text-sm font-medium text-ink">
                {t("lead.notes")}
              </label>
              <textarea
                id={`${idp}profile-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t("lead.notesPlaceholder")}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
              />
            </div>
          )}
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#d2232a]"
            />
            {t("lead.consentMarketing")}
          </label>
          {fieldError && (
            <p role="alert" className="text-sm text-brand">
              {fieldError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="h-11 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted/40"
            >
              {savingProfile ? t("common.sending") : t("lead.saveProfile")}
            </button>
            {mode === "popup" && onDone && (
              <button
                type="button"
                onClick={onDone}
                className="h-11 rounded-lg border border-border px-4 text-sm text-muted hover:text-ink"
              >
                {t("lead.skipProfile")}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {isBackendConfigured() && (
            <a
              href={`${API_BASE_URL}/api/auth/google`}
              className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:text-ink"
            >
              {t("auth.signInGoogle")}
            </a>
          )}
          {mode === "popup" && onDone && (
            <button
              type="button"
              onClick={onDone}
              className="h-11 rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark"
            >
              {t("common.close")}
            </button>
          )}
        </div>
      )}
    </div>
  );

  const body = step === "form" ? formBody : step === "otp" ? otpBody : doneBody;

  if (mode === "popup") {
    return <div>{body}</div>;
  }
  return (
    <section aria-label="Lead form" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t("lead.title")}</h2>
      <p className="mt-2 max-w-2xl text-muted">{t("lead.subtitle")}</p>
      {body}
    </section>
  );
}
