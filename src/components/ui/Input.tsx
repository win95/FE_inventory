// Ô nhập liệu dùng chung (FE 7) — label + gợi ý + báo lỗi tại chỗ.
"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export default function Input({ id, label, hint, error, className = "", ...rest }: InputProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand ${error ? "border-brand" : "border-border"} ${className}`}
        {...rest}
      />
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
