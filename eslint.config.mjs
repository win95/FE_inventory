import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Script Node chạy tay trong cms/scripts là CommonJS ('use strict' +
  // require('@strapi/strapi')) — chỉ cho phép require() ở đúng thư mục này.
  {
    files: ["cms/scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Strapi (cms/) là project riêng: bỏ qua output do Strapi sinh ra.
    "cms/dist/**",
    "cms/types/generated/**",
  ]),
]);

export default eslintConfig;
