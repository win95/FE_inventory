import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // MCP server tích hợp sẵn của Strapi (từ 5.47, GA 5.49): endpoint
  // POST /mcp, xác thực bằng admin API token, tool tự sinh theo từng
  // content type (Article, Case Study, Product, Home). Mặc định bật;
  // đặt STRAPI_MCP_ENABLED=false để tắt mà không cần sửa code.
  mcp: {
    enabled: env.bool('STRAPI_MCP_ENABLED', true),
  },
});

export default config;
