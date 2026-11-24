// Dialog "Get data" dùng chung (FE 16 + FE 19): bọc LeadForm chế độ popup
// trong Modal dùng chung (đóng bằng Escape + bấm nền). Mở từ header, CTA
// dưới mobile, CTA cuối trang Home và Talk to us — source ghi lại CTA nào
// đã mở form (trường ẩn, phục vụ đo hiệu quả từng khối).
"use client";

import LeadForm from "./LeadForm";
import { useLocale } from "./LocaleProvider";
import { Modal } from "./ui";

export default function LeadDialog({
  open,
  source,
  onClose,
}: {
  open: boolean;
  source: string;
  onClose: () => void;
}) {
  const { t } = useLocale();
  return (
    <Modal open={open} onClose={onClose} title={t("lead.dialogTitle")}>
      <LeadForm mode="popup" source={source} onDone={onClose} />
    </Modal>
  );
}
