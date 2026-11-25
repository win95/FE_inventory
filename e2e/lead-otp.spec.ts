// E2E lead + OTP (FE 51): Nhận dữ liệu → nhập form → mã sai còn 4 lần thử →
// mã đúng (đọc từ log email giả của BE) → bổ sung hồ sơ → đóng dialog.
// Nhãn nút ở /vi là "Nhận dữ liệu" (fix i18n e046e64 trên main: CTA header
// bản địa hóa theo locale; "Get data" chỉ còn ở /en).
import { expect, test } from "@playwright/test";
import { markLog, readOtpSince } from "./helpers";

test("lead + OTP flow", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`;
  await page.goto("/vi");
  await page.getByRole("button", { name: "Nhận dữ liệu" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.locator("#lead-popup-name").fill("E2E Test");
  await page.locator("#lead-popup-company").fill("AWING E2E");
  await page.locator("#lead-popup-email").fill(email);
  await page.locator("#lead-popup-phone").fill("+84901050517");
  await dialog.locator('input[type="checkbox"]').first().check();

  const mark = markLog();
  await dialog.locator('button[type="submit"]').click();

  // Bước OTP hiện ra.
  const otp = page.locator("#lead-popup-otp");
  await expect(otp).toBeVisible({ timeout: 10_000 });

  // Mã sai → còn 4 lần thử.
  await otp.fill("000000");
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toContainText("còn 4 lần thử");

  // Mã đúng đọc từ log BE.
  const code = await readOtpSince(mark);
  await otp.fill(code);
  await dialog.locator('button[type="submit"]').click();

  // Bước bổ sung hồ sơ: nhập brand rồi lưu.
  const brand = page.locator("#lead-popup-profile-brand");
  await expect(brand).toBeVisible({ timeout: 10_000 });
  await brand.fill("E2E Brand");
  await dialog.locator('button[type="submit"]').click();

  // Xong: dialog có nút đóng (nút "Đóng" ở bước xong — nút × góc dialog
  // cũng mang aria-label "Đóng" nên phải chọn theo text, không theo role).
  const close = dialog.getByText("Đóng", { exact: true });
  await expect(close).toBeVisible({ timeout: 10_000 });
  await close.click();
  await expect(dialog).toHaveCount(0);
});
