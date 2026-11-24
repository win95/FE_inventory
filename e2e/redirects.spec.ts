// E2E 301 (FE 51): 2 redirect trong redirects.json — /contact-us cũ về
// /contact. Next trả 308, Google tính như 301 (ghi trong SETUP §6.11).
import { expect, test } from "@playwright/test";

for (const locale of ["vi", "en"] as const) {
  test(`${locale}/contact-us redirects to ${locale}/contact`, async ({ request, baseURL }) => {
    const res = await request.get(`/${locale}/contact-us`, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toBe(`/${locale}/contact`);

    const dest = await request.get(`/${locale}/contact`);
    expect(dest.status()).toBe(200);
    expect(baseURL).toBeTruthy();
  });
}
