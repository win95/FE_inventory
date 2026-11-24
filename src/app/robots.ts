import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// robots.txt (FE 6, FIX-01: sitemap trỏ domain thật).
// /api/ (gồm /api/revalidate) không cho crawler vào.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
