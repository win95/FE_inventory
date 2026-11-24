import type { MetadataRoute } from "next";
import { localizedUrl } from "@/lib/seo";
import { LOCALES } from "@/lib/i18n";

// Sitemap tĩnh cho các route đã có (FE 6, FIX-01: trỏ domain thật).
// Route động (products, resources, events, news, careers...) bổ sung ở
// R1-3/R1-4 khi trang có thật — lấy slug từ Strapi qua src/lib/strapi.ts.
// Một entry cho mỗi trang, <loc> là URL locale mặc định (vi), alternates
// liệt kê cả hai locale (theo mẫu sitemap đa ngôn ngữ của Next.js).
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/advertisers", priority: 0.8, changeFrequency: "weekly" },
  { path: "/locations", priority: 0.8, changeFrequency: "daily" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => ({
    url: localizedUrl("vi", route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, localizedUrl(locale, route.path)]),
      ),
    },
  }));
}
