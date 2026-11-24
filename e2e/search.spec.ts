// E2E tìm kiếm (FE 51): gợi ý trong overlay (gõ → gợi ý → phím mũi tên +
// Enter đi tới trang) và trang /search (tab có số đếm, trạng thái rỗng).
import { expect, test } from "@playwright/test";

test("search overlay: suggestions + keyboard navigation", async ({ page }) => {
  await page.goto("/vi");
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  const dialog = page.getByRole("dialog", { name: "Tìm kiếm" });
  const input = dialog.getByRole("combobox");
  await expect(input).toBeVisible();
  await input.fill("retail");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible({ timeout: 10_000 });
  await expect(listbox).toContainText("Retail Media");

  // Mũi tên xuống chọn gợi ý đầu, Enter đi tới đúng gợi ý đó (thứ tự do BE trả).
  const firstHref = await listbox.locator("a").first().getAttribute("href");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(new RegExp(firstHref!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
});

test("search overlay: Esc closes", async ({ page }) => {
  await page.goto("/vi");
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  const dialog = page.getByRole("dialog", { name: "Tìm kiếm" });
  await dialog.getByRole("combobox").fill("wifi");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Tìm kiếm" })).toHaveCount(0);
});

test("search page: tabs with counts + empty state", async ({ page }) => {
  await page.goto("/vi/search?q=retail");
  await expect(page.getByRole("tab", { name: /Tất cả \(\d+\)/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Sản phẩm \(\d+\)/ })).toBeVisible();
  await expect(page.locator("main")).toContainText("Retail Media");

  await page.getByRole("tab", { name: /Tin tức/ }).click();
  await expect(page).toHaveURL(/tab=news/);

  await page.goto("/vi/search?q=xyznothinghere");
  await expect(page.locator("main")).toContainText("Không tìm thấy kết quả");
});
