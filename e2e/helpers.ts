// Helper đọc mã OTP từ log email giả lập của BE (BE 13, EMAIL_PROVIDER=fake).
// BE chỉ log mã trong hàm _send của email.py — log là nguồn duy nhất để
// E2E lấy mã mà không cần hộp thư thật. Ghi dấu vị trí file TRƯỚC khi gửi
// lead, rồi chỉ đọc phần ghi thêm sau đó, để mã cũ không lọt vào test.
import * as fs from "node:fs";

function beLogPath(): string {
  if (process.env.BE_LOG_PATH) return process.env.BE_LOG_PATH;
  const files = fs
    .readdirSync("/tmp")
    .filter((f) => f.startsWith("be-") && f.endsWith(".log"))
    .map((f) => `/tmp/${f}`)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (files.length === 0) throw new Error("Không tìm thấy log BE trong /tmp/be-*.log — đặt BE_LOG_PATH");
  return files[0];
}

export function markLog(): { path: string; size: number } {
  const path = beLogPath();
  return { path, size: fs.existsSync(path) ? fs.statSync(path).size : 0 };
}

export async function readOtpSince(mark: { path: string; size: number }): Promise<string> {
  const deadline = Date.now() + 15_000;
  const re = /(?:Mã xác thực AWING của bạn là:|Your AWING verification code is:) (\d{6})/g;
  while (Date.now() < deadline) {
    // Đọc theo BYTE (subarray trên Buffer): slice() trên string đếm theo
    // ký tự UTF-16, còn mark.size là byte — log có tiếng Việt (nhiều byte
    // 1 ký tự) nên slice theo ký tự sẽ cắt sai và bỏ lỡ mã OTP.
    const text = fs.existsSync(mark.path)
      ? fs.readFileSync(mark.path).subarray(mark.size).toString("utf8")
      : "";
    const matches = [...text.matchAll(re)];
    if (matches.length > 0) return matches[matches.length - 1][1];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Không thấy mã OTP trong log BE ${mark.path} sau 15s`);
}
