// Cấu hình E2E cho AWING Home Public (FE 51, R1-5).
//
// Chạy với stack local đang mở: Strapi :1337 (đã seed), BE :8000,
// FE standalone :3100. Ví dụ:
//   E2E_BASE_URL=http://127.0.0.1:3100 BE_LOG_PATH=/tmp/be-r15.log npx playwright test
// BE_LOG_PATH là file log của BE đang chạy — spec lead+OTP đọc mã OTP
// từ log email giả lập ([FAKE EMAIL]) trong file đó. Không đặt thì tự
// tìm file /tmp/be-*.log mới nhất.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
});
