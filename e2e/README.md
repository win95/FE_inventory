# E2E — AWING Home Public (FE 51)

Chạy với stack local đang mở: Strapi `:1337` (đã seed), BE `:8000`, FE standalone `:3100`.

```bash
# Cài 1 lần (browser đã có sẵn trong ~/.cache/ms-playwright):
npm install --save-dev @playwright/test

# Chạy toàn bộ:
E2E_BASE_URL=http://127.0.0.1:3100 BE_LOG_PATH=/tmp/be-r15.log npx playwright test --config e2e/playwright.config.ts

# Chạy 1 file:
npx playwright test --config e2e/playwright.config.ts e2e/search.spec.ts
```

Ghi chú:

- `BE_LOG_PATH` là file log của BE đang chạy — spec `lead-otp` đọc mã OTP từ
  log email giả lập (`[FAKE EMAIL]`) trong file đó. Không đặt thì tự tìm
  file `/tmp/be-*.log` mới nhất.
- Spec lead dùng email duy nhất theo timestamp (`e2e+<ts>@example.com`) để
  không chạm rate limit/dedupe 10 phút của BE.
- `redirects.spec.ts`: Next trả 308, Google tính như 301 (SETUP §6.11).
- Chỉ chạy local — không chạy trên staging/production (OTP giả lập + dữ liệu
  seed chỉ có ở môi trường dev).
