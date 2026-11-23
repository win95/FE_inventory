// Select dùng chung (FE 7) — <select> gốc (bàn phím + đọc màn hình tốt nhất),
// chỉ khoác kiểu R1; label + báo lỗi giống Input.
"use client";

import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
}

export default function Select({ id, label, options, hint, error, className = "", ...rest }: SelectProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink outline-none focus:border-brand ${error ? "border-brand" : "border-border"} ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-brand">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
