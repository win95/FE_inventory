// Backfill R1-4 cho DB đã seed trước khi có 2 trường mới (23/11/2026):
// - case-study.slug (uid) — để /case-studies/[slug] + link từ Customers.
// - resource.industry — để lọc theo ngành ở /resources.
// Chạy 1 lần trên DB hiện tại (cms/.tmp/seed.db); seed chính đã cập nhật
// nên lần seed --force sau sẽ tự có 2 trường này. Boot Strapi bằng code
// giống seed (compileStrapi + createStrapi().load()).
//   DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/seed.db node scripts/backfill-r14.js
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const CASE_STUDY_SLUGS = {
  'Thương hiệu FMCG tăng 340% Brand Recall': 'fmcg-brand-recall-340',
  'Ứng dụng gọi xe: 2,4 triệu lượt cài mới': 'ung-dung-goi-xe-24-trieu-luot-cai',
  'Ngân hàng số: ₫18B giá trị giao dịch': 'ngan-hang-so-18b-giao-dich',
};

const RESOURCE_INDUSTRY = {
  'bao-cao-vietnam-offline-attention-2026': 'Retail',
  'bao-cao-vietnam-offline-attention-2025': 'Retail',
  'retail-media-tai-viet-nam-2026': 'Retail',
  'footfall-attribution-huong-dan': 'Measurement',
  'wifi-marketing-playbook': 'Marketing',
  'shopper-insights-fmcg': 'FMCG',
  'case-study-fmcg-brand-recall': 'FMCG',
  'case-study-ung-dung-goi-xe': 'Technology',
  'case-study-ngan-hang-so': 'Finance',
  'bao-cao-xu-huong-ooh-2025': 'Media',
  'do-luong-xuyen-kenh': 'Measurement',
  'cam-nang-quang-cao-tai-diem-ban': 'Retail',
};

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  try {
    // Lấy hết theo trang (limit 100/trang): dữ liệu tăng quá 100 thì
    // findMany một lần sẽ bỏ sót.
    async function fetchAll(uid) {
      const out = [];
      let start = 0;
      for (;;) {
        const page = await app.documents(uid).findMany({ locale: 'vi', status: 'published', limit: 100, start });
        out.push(...page);
        if (page.length < 100) break;
        start += page.length;
      }
      return out;
    }
    let n = 0;
    const cases = await fetchAll('api::case-study.case-study');
    for (const d of cases) {
      const slug = CASE_STUDY_SLUGS[d.title];
      if (!slug) { console.log(`[backfill] case-study không khớp: ${d.title}`); continue; }
      if (d.slug === slug) continue;
      await app.documents('api::case-study.case-study').update({ documentId: d.documentId, locale: 'vi', data: { slug }, status: 'published' });
      n += 1;
    }
    console.log(`[backfill] case-studies: ${n} cập nhật slug`);

    let m = 0;
    const resources = await fetchAll('api::resource.resource');
    for (const d of resources) {
      const industry = RESOURCE_INDUSTRY[d.slug];
      if (!industry) { console.log(`[backfill] resource không khớp: ${d.slug}`); continue; }
      if (d.industry === industry) continue;
      await app.documents('api::resource.resource').update({ documentId: d.documentId, locale: 'vi', data: { industry }, status: 'published' });
      m += 1;
    }
    console.log(`[backfill] resources: ${m} cập nhật industry`);
    console.log('BACKFILL DONE');
  } finally {
    await app.destroy();
  }
}

main().catch((e) => { console.error('[backfill] FAILED', e); process.exit(1); });
