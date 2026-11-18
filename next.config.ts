import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone để chạy trong Docker (xem Dockerfile): server Node
  // gọn nhẹ, chỉ cần .next/standalone + .next/static + public.
  output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
