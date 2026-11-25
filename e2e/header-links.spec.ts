// E2E header (đóng gói 24/11, sau review FE): mọi mục menu đều là link tới
// trang thật, không còn mục chết; mega menu Products bấm được (không tự đóng
// trước khi điều hướng); dropdown điều hướng bằng phím mũi tên.
import { expect, test } from "@playwright/test";

test("header: no dead menu items, product links resolve", async ({ page }) => {
  await page.goto("/vi");
  const header = page.locator("header").first();
  await expect(header).toBeVisible();

  // Không còn mục menu chết trong header (span mờ / aria-disabled).
  await expect(header.locator('[aria-disabled="true"]')).toHaveCount(0);
  await expect(header.locator(".cursor-not-allowed")).toHaveCount(0);

  // Mega menu Products: mở, bấm tên sản phẩm đầu → tới đúng trang.
  await page.getByRole("button", { name: "Sản phẩm", exact: true }).click();
  const productLink = header.locator('a[href^="/vi/products/"]').first();
  await expect(productLink).toBeVisible();
  const href = await productLink.getAttribute("href");
  await productLink.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
});

test("header: dropdown links resolve + arrow-key navigation", async ({ page }) => {
  await page.goto("/vi");
  // Insights → Sự kiện (link thật tới /events).
  await page.getByRole("button", { name: "Insights & Tài nguyên" }).click();
  const eventsLink = page.getByRole("menuitem", { name: "Sự kiện" });
  await expect(eventsLink).toBeVisible();
  await eventsLink.click();
  await expect(page).toHaveURL(/\/vi\/events$/);

  // Điều hướng bằng phím mũi tên trong dropdown Company.
  await page.getByRole("button", { name: "Công ty" }).click();
  const menu = page.getByRole("menu").first();
  await expect(menu).toBeVisible();
  const first = menu.getByRole("menuitem").first();
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem").nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
});
