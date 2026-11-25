// Nút dùng chung (FE 7) — 5 biến thể theo token R1 (§7.2), 3 cỡ.
// href nội bộ thì render Next Link, href ngoài thì <a> thường.
// disabled + href: link vẫn focus được nhưng bấm không đi đâu (aria-disabled
// + chặn click), vì <a> không có thuộc tính disabled như <button>.
"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "subtle" | "light";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  outline: "border border-border bg-white text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink hover:bg-surface",
  subtle: "bg-surface text-ink hover:bg-line",
  light: "bg-white text-brand hover:bg-surface",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ariaLabel,
}: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${disabled ? "cursor-not-allowed opacity-40" : ""} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto:");
    const linkProps = {
      className: cls,
      "aria-label": ariaLabel,
      "aria-disabled": disabled || undefined,
      onClick: disabled ? (event: React.MouseEvent) => event.preventDefault() : undefined,
    };
    if (external) {
      return (
        <a href={href} {...linkProps}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} {...linkProps}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
