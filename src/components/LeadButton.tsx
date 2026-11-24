// Nút mở dialog lead (R1-3, FE 27): dùng ở các trang server (Product,
// Solution, AdFormats) — nơi không gọi trực tiếp được hook useOpenLead
// vì là server component. Source ghi lại CTA nào đã mở form.
"use client";

import Button, { type ButtonSize, type ButtonVariant } from "./ui/Button";
import { useOpenLead } from "./LeadContext";

export default function LeadButton({
  source,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  source: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const openLead = useOpenLead();
  return (
    <Button variant={variant} size={size} className={className} onClick={() => openLead(source)}>
      {children}
    </Button>
  );
}
