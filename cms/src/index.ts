import type { Core } from '@strapi/strapi';

// Các action public mà Frontend cần: chỉ đọc bản published, không ghi.
// Quyền này được cấp tự động mỗi lần Strapi khởi động (idempotent) để khỏi
// phải bấm tay trong admin sau mỗi lần dựng lại database.
const PUBLIC_ACTIONS = [
  'api::article.article.find',
  'api::article.article.findOne',
  'api::case-study.case-study.find',
  'api::case-study.case-study.findOne',
  'api::product.product.find',
  'api::product.product.findOne',
  'api::home.home.find',
  'api::home.home.findOne',
  // BE 2-4 (R1-1): các loại nội dung mới — Frontend chỉ đọc bản published.
  'api::solution.solution.find',
  'api::solution.solution.findOne',
  'api::ad-format.ad-format.find',
  'api::ad-format.ad-format.findOne',
  'api::resource.resource.find',
  'api::resource.resource.findOne',
  'api::event.event.find',
  'api::event.event.findOne',
  'api::job.job.find',
  'api::job.job.findOne',
  'api::partner.partner.find',
  'api::partner.partner.findOne',
  'api::customer.customer.find',
  'api::customer.customer.findOne',
  // Single type chỉ có find (không có findOne).
  'api::data-snapshot.data-snapshot.find',
  'api::global.global.find',
];

const WEBHOOK_EVENTS = ['entry.publish', 'entry.unpublish', 'entry.update'];

// i18n: hai locale EN + VI, mặc định là VI (site chạy tiếng Việt trước).
// Strapi tự tạo locale 'en' mặc định ở lần boot đầu nếu chưa có locale nào;
// hàm này chỉ tạo thêm những locale còn thiếu rồi đặt mặc định về 'vi'
// (idempotent — chạy lại không tạo trùng, không đổi gì nếu đã đúng).
const LOCALES = [
  { name: 'English', code: 'en' },
  { name: 'Tiếng Việt', code: 'vi' },
];
const DEFAULT_LOCALE_CODE = 'vi';

async function ensureLocales(strapi: Core.Strapi) {
  const localesService = strapi.plugin('i18n').service('locales');
  for (const locale of LOCALES) {
    const existing = await localesService.findByCode(locale.code);
    if (!existing) {
      await localesService.create(locale);
      strapi.log.info(`[bootstrap] Đã tạo locale: ${locale.code} (${locale.name})`);
    }
  }
  const currentDefault = await localesService.getDefaultLocale();
  if (currentDefault !== DEFAULT_LOCALE_CODE) {
    await localesService.setDefaultLocale({ code: DEFAULT_LOCALE_CODE });
    strapi.log.info(`[bootstrap] Đã đặt locale mặc định: ${DEFAULT_LOCALE_CODE}`);
  }
}

async function grantPublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) {
    strapi.log.warn('[bootstrap] Không tìm thấy role public — bỏ qua cấp quyền.');
    return;
  }
  const existing = await strapi.db
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: role.id } });
  const granted = new Set(existing.map((p: { action: string }) => p.action));
  for (const action of PUBLIC_ACTIONS) {
    if (!granted.has(action)) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action, role: role.id },
      });
      strapi.log.info(`[bootstrap] Đã cấp quyền public: ${action}`);
    }
  }
}

async function ensureStrapiWebhook(strapi: Core.Strapi) {
  const url = process.env.STRAPI_WEBHOOK_URL;
  if (!url) {
    return;
  }
  // UID đúng của Strapi 5 là 'strapi::webhook' (xem @strapi/core webhook-store).
  const existing = await strapi.db
    .query('strapi::webhook')
    .findMany({ where: { url } });
  if (existing.length > 0) {
    return;
  }
  await strapi.db.query('strapi::webhook').create({
    data: {
      name: 'awing-backend',
      url,
      headers: {},
      events: WEBHOOK_EVENTS,
      enabled: true,
    },
  });
  strapi.log.info(`[bootstrap] Đã tạo webhook tới backend: ${url}`);
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Bootstrap không được làm sập server: lỗi ở đây chỉ ghi log.
    try {
      await ensureLocales(strapi);
    } catch (error) {
      strapi.log.error('[bootstrap] Không tạo được locale i18n:', error);
    }
    try {
      await grantPublicPermissions(strapi);
    } catch (error) {
      strapi.log.error('[bootstrap] Không cấp được quyền public:', error);
    }
    try {
      await ensureStrapiWebhook(strapi);
    } catch (error) {
      strapi.log.error('[bootstrap] Không tạo được webhook:', error);
    }
  },
};
