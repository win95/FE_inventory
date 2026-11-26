import type { MetadataRoute } from "next";
import { localizedUrl } from "@/lib/seo";
import { LOCALES } from "@/lib/i18n";
import {
  fetchArticles,
  fetchCaseStudies,
  fetchEvents,
  fetchJobs,
  fetchProducts,
  fetchResources,
} from "@/lib/strapi";

// Sitemap (FE 6 + M7, đóng gói 24/11): route tĩnh đầy đủ + route động lấy
// slug từ Strapi (products/solutions, resources, events, news, careers,
// case studies). Một entry cho mỗi trang, <loc> là URL locale mặc định (vi),
// alternates liệt kê cả hai locale (theo mẫu sitemap đa ngôn ngữ của Next.js).
// lastModified lấy từ ngày thật (publishedDate/startDate) — không dùng
// new Date() (mỗi lần fetch đều báo "vừa sửa" thì mất tác dụng). Strapi lỗi
// thì chỉ trả route tĩnh, sitemap không crash.
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/advertisers", priority: 0.8, changeFrequency: "weekly" },
  { path: "/locations", priority: 0.8, changeFrequency: "daily" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ad-formats", priority: 0.7, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.8, changeFrequency: "daily" },
  { path: "/events", priority: 0.8, changeFrequency: "weekly" },
  { path: "/news", priority: 0.8, changeFrequency: "daily" },
  { path: "/careers", priority: 0.7, changeFrequency: "weekly" },
  { path: "/case-studies", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partners", priority: 0.6, changeFrequency: "monthly" },
  { path: "/customers", priority: 0.6, changeFrequency: "monthly" },
  { path: "/investors", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/search", priority: 0.5, changeFrequency: "daily" },
];

function entry(
  path: string,
  opts?: {
    lastModified?: string | null;
    priority?: number;
    changeFrequency?: "daily" | "weekly" | "monthly";
  },
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl("vi", path),
    ...(opts?.lastModified ? { lastModified: new Date(opts.lastModified) } : {}),
    changeFrequency: opts?.changeFrequency ?? "weekly",
    priority: opts?.priority ?? 0.7,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, localizedUrl(locale, path)]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) =>
    entry(route.path, { priority: route.priority, changeFrequency: route.changeFrequency }),
  );
  try {
    const [products, resources, events, articles, jobs, studies] = await Promise.all([
      fetchProducts("vi", "force-cache"),
      fetchResources("vi", 100, undefined, "force-cache"),
      fetchEvents("vi", 100, undefined, "force-cache"),
      // 118 bài — limit mặc định 100 sẽ cắt mất 18 bài khỏi sitemap.
      fetchArticles("vi", 200, undefined, "force-cache"),
      fetchJobs("vi", "force-cache"),
      fetchCaseStudies("vi", "force-cache"),
    ]);
    for (const p of products) {
      out.push(entry(`/products/${p.slug}`, { priority: 0.8 }));
      for (const s of p.solutions) {
        out.push(entry(`/products/${p.slug}/${s.slug}`, { priority: 0.7 }));
      }
    }
    for (const r of resources) {
      out.push(entry(`/resources/${r.slug}`, { lastModified: r.publishedDate, priority: 0.7 }));
    }
    for (const e of events) {
      out.push(entry(`/events/${e.slug}`, { lastModified: e.startDate, priority: 0.7 }));
    }
    for (const a of articles) {
      out.push(entry(`/news/${a.slug}`, { lastModified: a.publishedDate, priority: 0.7 }));
    }
    for (const j of jobs) {
      out.push(entry(`/careers/${j.slug}`, { priority: 0.6 }));
    }
    for (const cs of studies) {
      out.push(entry(`/case-studies/${cs.slug}`, { priority: 0.6 }));
    }
  } catch {
    // Strapi chưa tới được — giữ nguyên route tĩnh.
  }
  return out;
}
