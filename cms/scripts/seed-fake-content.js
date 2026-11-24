'use strict';
// Seed dữ liệu GIẢ LẬP cho Strapi (R1, theo quyết định của tran 23/11/2026:
// làm hết R1 bằng dữ liệu giả — Strapi tạo dữ liệu giả trong database của nó,
// FastAPI dùng dữ liệu giả trong SQLite).
//
// Chạy:  cd cms && node scripts/seed-fake-content.js [--force]
//   --force: xoá hết dữ liệu đã seed của các loại này rồi tạo lại.
//   Không có --force: loại nào đã có dữ liệu thì bỏ qua (idempotent).
// Yêu cầu: DATABASE_* trong .env (Postgres trên máy tran) hoặc
//   DATABASE_CLIENT=sqlite DATABASE_FILENAME=tmp/seed.db (kiểm thử local).
//
// Nội dung: 6 Product + 26 Solution + 4 AdFormat + 12 Resource + 6 Event +
// 118 Article (News) + 6 Job + 8 Partner + 6 Customer + 3 CaseStudy +
// 12 FAQ + DataSnapshot + Global + Home — tất cả vi + en, đã publish.
// Tên sản phẩm/solution GIỮ TIẾNG ANH ở cả 2 locale (theo Figma).
// Lưu ý đã kiểm chứng 23/11: relation (product.solutions, solution.product,
// ad-format.solution, customer.caseStudy) lưu THEO TỪNG LOCALE ở Strapi này
// nên seed phải đặt relation ở cả bản vi và bản en; richtext validate dạng
// string (không phải Blocks JSON).
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const FORCE = process.argv.includes('--force');
const log = (...a) => console.log('[seed]', ...a);

// Rich text Strapi 5 ở project này validate dạng STRING (xem
// @strapi/core entity-validator: richtext: stringValidator) — không phải
// định dạng Blocks JSON. Các đoạn nối nhau bằng dòng trống; FE render bằng
// cách tách đoạn.
const rt = (...texts) => texts.join('\n\n');

// ---------------------------------------------------------------------------
// 6 sản phẩm + 26 solution (khớp src/lib/products.ts — Figma mới 23/11)
// ---------------------------------------------------------------------------
const PRODUCTS = [
  {
    slug: 'location-based-channel', name: 'Location-Based Channel',
    slogan: 'The right people, in the right place, at the right moment.',
    color: 'location', order: 1,
    taglineVi: 'Tiếp cận đúng người, đúng nơi, đúng lúc.',
    taglineEn: 'The right people, in the right place, at the right moment.',
    goalVi: 'Hiển thị quảng cáo theo vị trí thực của người dùng.',
    goalEn: 'Show ads based on where people really are.',
    descVi: 'Kênh quảng cáo theo vị trí: đưa thương hiệu đến đúng người, tại đúng địa điểm, vào đúng thời điểm họ ra quyết định.',
    descEn: 'Location-based advertising: put your brand in front of the right people, at the right place, at the moment they decide.',
  },
  {
    slug: 'retail-media-activation', name: 'Retail Media & Activation',
    slogan: 'Put your brand next to the buying decision.',
    color: 'retail', order: 2,
    taglineVi: 'Đặt thương hiệu ngay cạnh quyết định mua hàng.',
    taglineEn: 'Put your brand next to the buying decision.',
    goalVi: 'Kích hoạt mua sắm ngay tại điểm bán.',
    goalEn: 'Activate shoppers right at the point of sale.',
    descVi: 'Biến điểm bán thành kênh truyền thông: Wi-Fi, màn hình và ưu đãi tại cửa hàng đưa thương hiệu đến đúng lúc khách hàng chọn mua.',
    descEn: 'Turn stores into media: in-store Wi-Fi, screens and offers reach shoppers at the exact moment they choose.',
  },
  {
    slug: 'measurement', name: 'Measurement',
    slogan: 'Prove impact with real numbers.',
    color: 'measurement', order: 3,
    taglineVi: 'Chứng minh hiệu quả bằng số liệu thật.',
    taglineEn: 'Prove impact with real numbers.',
    goalVi: 'Đo lường tác động offline của chiến dịch.',
    goalEn: 'Measure the offline impact of campaigns.',
    descVi: 'Đo lường bằng dữ liệu vị trí thực: footfall, brand lift, chuyển đổi offline — không còn đo bằng cảm tính.',
    descEn: 'Measure with real location data: footfall, brand lift, offline conversion — no more guesswork.',
  },
  {
    slug: 'insights', name: 'Insights',
    slogan: 'Understand consumers through real-world moments.',
    color: 'insight', order: 4,
    taglineVi: 'Hiểu người tiêu dùng qua khoảnh khắc đời thực.',
    taglineEn: 'Understand consumers through real-world moments.',
    goalVi: 'Đọc hành vi tiêu dùng từ dữ liệu vị trí.',
    goalEn: 'Read consumer behaviour from location data.',
    descVi: 'Hiểu người tiêu dùng qua những nơi họ đến, những gì họ làm — từ xu hướng địa điểm đến benchmark ngành.',
    descEn: 'Understand consumers through the places they go and what they do — from location trends to category benchmarks.',
  },
  {
    slug: 'network', name: 'Network',
    slogan: 'The network behind the moments.',
    color: 'network', order: 5,
    taglineVi: 'Mạng lưới đứng sau mọi khoảnh khắc.',
    taglineEn: 'The network behind the moments.',
    goalVi: 'Mở rộng và vận hành mạng lưới địa điểm.',
    goalEn: 'Grow and operate the location network.',
    descVi: 'Mạng lưới hàng nghìn địa điểm trên 63 tỉnh thành — hạ tầng Wi-Fi biến mỗi điểm chạm thành cơ hội cho thương hiệu.',
    descEn: 'A network of thousands of venues across 63 provinces — Wi-Fi infrastructure turning every touchpoint into a brand opportunity.',
  },
  {
    slug: 'ads-manager', name: 'Ads Manager',
    slogan: 'Plan, track and optimise on your own.',
    color: 'adsmanager', order: 6,
    taglineVi: 'Tự lập kế hoạch, theo dõi và tối ưu.',
    taglineEn: 'Plan, track and optimise on your own.',
    goalVi: 'Tự phục vụ: tạo và quản lý chiến dịch.',
    goalEn: 'Self-serve: create and manage campaigns.',
    descVi: 'Tự tạo chiến dịch, chọn đối tượng theo vị trí, đặt ngân sách và xem báo cáo trực tiếp — không cần qua trung gian.',
    descEn: 'Build campaigns yourself, target audiences by location, set budgets and watch live reports — no middleman needed.',
  },
];

const SOLUTIONS = [
  // Location-Based Channel (5)
  { slug: 'interactive-ad-experiences', name: 'Interactive Ad Experiences', product: 'location-based-channel',
    sumVi: 'Định dạng quảng cáo tương tác: Bumper, Banner, TVC trên Wi-Fi.', sumEn: 'Interactive ad formats: Bumper, Banner and TVC over Wi-Fi.' },
  { slug: 'geo-targeted-campaigns', name: 'Geo-Targeted Campaigns', product: 'location-based-channel',
    sumVi: 'Nhắm mục tiêu theo khu vực, bán kính và loại địa điểm.', sumEn: 'Target by area, radius and venue type.' },
  { slug: 'place-based-audiences', name: 'Place-Based Audiences', product: 'location-based-channel',
    sumVi: 'Nhóm đối tượng xây từ hành vi ghé thăm địa điểm thực.', sumEn: 'Audiences built from real venue visits.' },
  { slug: 'wifi-splash-engagement', name: 'Wi-Fi Splash Engagement', product: 'location-based-channel',
    sumVi: 'Tương tác ngay trang đăng nhập Wi-Fi.', sumEn: 'Engage users right on the Wi-Fi login page.' },
  { slug: 'always-on-reach', name: 'Always-On Reach', product: 'location-based-channel',
    sumVi: 'Hiện diện liên tục tại các điểm chạm đông người.', sumEn: 'Always-on presence at high-traffic touchpoints.' },
  // Retail Media & Activation (5)
  { slug: 'in-store-wifi-media', name: 'In-Store Wi-Fi Media', product: 'retail-media-activation',
    sumVi: 'Quảng cáo trên Wi-Fi trong cửa hàng.', sumEn: 'Advertising on in-store Wi-Fi.' },
  { slug: 'shopper-activation', name: 'Shopper Activation', product: 'retail-media-activation',
    sumVi: 'Kích hoạt người mua ngay trong cửa hàng.', sumEn: 'Activate shoppers inside the store.' },
  { slug: 'mall-digital-promotions', name: 'Mall Digital Promotions', product: 'retail-media-activation',
    sumVi: 'Khuyến mãi số tại trung tâm thương mại.', sumEn: 'Digital promotions in malls.' },
  { slug: 'sampling-and-coupons', name: 'Sampling & Coupons', product: 'retail-media-activation',
    sumVi: 'Phát mẫu thử và coupon số tại điểm bán.', sumEn: 'Digital sampling and coupons at the point of sale.' },
  { slug: 'retail-partner-network', name: 'Retail Partner Network', product: 'retail-media-activation',
    sumVi: 'Mạng lưới đối tác bán lẻ trên toàn quốc.', sumEn: 'A nationwide retail partner network.' },
  // Measurement (4)
  { slug: 'footfall-attribution', name: 'Footfall Attribution', product: 'measurement',
    sumVi: 'Ghi nhận lượt ghé cửa hàng sau khi xem quảng cáo.', sumEn: 'Attribute store visits after ad exposure.' },
  { slug: 'brand-lift', name: 'Brand Lift', product: 'measurement',
    sumVi: 'Đo mức tăng nhận biết và yêu thích thương hiệu.', sumEn: 'Measure lifts in awareness and favourability.' },
  { slug: 'campaign-reporting', name: 'Campaign Reporting', product: 'measurement',
    sumVi: 'Báo cáo chiến dịch theo thời gian thực.', sumEn: 'Live campaign reporting.' },
  { slug: 'offline-conversion', name: 'Offline Conversion', product: 'measurement',
    sumVi: 'Nối quảng cáo với giao dịch mua hàng offline.', sumEn: 'Connect ads to offline purchases.' },
  // Insights (4)
  { slug: 'audience-insights', name: 'Audience Insights', product: 'insights',
    sumVi: 'Chân dung đối tượng theo hành vi vị trí.', sumEn: 'Audience profiles from location behaviour.' },
  { slug: 'location-trends', name: 'Location Trends', product: 'insights',
    sumVi: 'Xu hướng ghé thăm theo địa điểm và thời gian.', sumEn: 'Visit trends by place and time.' },
  { slug: 'category-benchmarks', name: 'Category Benchmarks', product: 'insights',
    sumVi: 'So sánh ngành với mặt bằng chung thị trường.', sumEn: 'Benchmark your category against the market.' },
  { slug: 'custom-research', name: 'Custom Research', product: 'insights',
    sumVi: 'Nghiên cứu riêng theo câu hỏi của nhãn hàng.', sumEn: 'Custom research for your brand questions.' },
  // Network (4)
  { slug: 'partner-network', name: 'Partner Network', product: 'network',
    sumVi: 'Mạng lưới đối tác địa điểm trên 63 tỉnh thành.', sumEn: 'A venue partner network across 63 provinces.' },
  { slug: 'wifi-monetization', name: 'Wi-Fi Monetization', product: 'network',
    sumVi: 'Biến Wi-Fi miễn phí thành nguồn doanh thu.', sumEn: 'Turn free Wi-Fi into revenue.' },
  { slug: 'venue-onboarding', name: 'Venue Onboarding', product: 'network',
    sumVi: 'Đưa địa điểm mới lên mạng lưới nhanh chóng.', sumEn: 'Bring new venues onto the network fast.' },
  { slug: 'network-health', name: 'Network Health', product: 'network',
    sumVi: 'Giám sát chất lượng và độ phủ mạng lưới.', sumEn: 'Monitor network quality and coverage.' },
  // Ads Manager (4)
  { slug: 'campaign-builder', name: 'Campaign Builder', product: 'ads-manager',
    sumVi: 'Tự tạo chiến dịch trong vài phút.', sumEn: 'Build a campaign in minutes.' },
  { slug: 'audience-geo-targeting', name: 'Audience & Geo Targeting', product: 'ads-manager',
    sumVi: 'Chọn đối tượng và khu vực ngay trên bản đồ.', sumEn: 'Pick audiences and areas right on the map.' },
  { slug: 'budget-and-bidding', name: 'Budget & Bidding', product: 'ads-manager',
    sumVi: 'Đặt ngân sách và đấu giá linh hoạt.', sumEn: 'Flexible budgets and bidding.' },
  { slug: 'live-reporting', name: 'Live Reporting', product: 'ads-manager',
    sumVi: 'Báo cáo trực tiếp theo từng giờ.', sumEn: 'Hourly live reporting.' },
];

// Định dạng quảng cáo (số liệu mẫu Figma).
const AD_FORMATS = [
  { slug: 'bumper-ads', name: 'Bumper Ads', formatType: 'video', durationSeconds: 6, metricLabel: 'Engagement', metricValue: 94,
    solution: 'interactive-ad-experiences',
    descVi: 'Quảng cáo ngắn 6 giây, xuất hiện ngay khi đăng nhập Wi-Fi.',
    descEn: 'A 6-second ad shown right at Wi-Fi login.' },
  { slug: 'banner-slide', name: 'Banner / Slide', formatType: 'banner', durationSeconds: 15, metricLabel: 'Engagement', metricValue: 78,
    solution: 'interactive-ad-experiences',
    descVi: 'Banner trượt 15 giây với hình ảnh và ưu đãi.',
    descEn: 'A 15-second sliding banner with visuals and offers.' },
  { slug: 'text-matching', name: 'Text Matching', formatType: 'text', durationSeconds: 30, metricLabel: 'Engagement', metricValue: 62,
    solution: 'interactive-ad-experiences',
    descVi: 'Mẩu quảng cáo chữ 30 giây khớp ngữ cảnh địa điểm.',
    descEn: 'A 30-second text ad matched to the venue context.' },
  { slug: 'video-full-screen', name: 'Video Full Screen', formatType: 'video', durationSeconds: 30, metricLabel: 'Engagement', metricValue: 88,
    solution: 'interactive-ad-experiences',
    descVi: 'Video toàn màn hình 30 giây, trải nghiệm điện ảnh.',
    descEn: 'A 30-second full-screen video, a cinematic experience.' },
];

// ---------------------------------------------------------------------------
// Tài liệu, sự kiện, case study, khách hàng, đối tác, việc làm, FAQ
// ---------------------------------------------------------------------------
const RESOURCES = [
  { slug: 'bao-cao-vietnam-offline-attention-2026', type: 'report', year: 2026, industry: 'Retail',
    titleVi: 'Báo cáo Vietnam Offline Attention 2026', titleEn: 'Vietnam Offline Attention Report 2026',
    sumVi: 'Toàn cảnh sự chú ý của người tiêu dùng ngoài đời thực năm 2026.',
    sumEn: 'The full picture of real-world consumer attention in 2026.' },
  { slug: 'bao-cao-vietnam-offline-attention-2025', type: 'report', year: 2025, industry: 'Retail',
    titleVi: 'Báo cáo Vietnam Offline Attention 2025', titleEn: 'Vietnam Offline Attention Report 2025',
    sumVi: 'Số liệu nền năm 2025 để đối chiếu xu hướng.',
    sumEn: '2025 baseline data for trend comparison.' },
  { slug: 'retail-media-tai-viet-nam-2026', type: 'report', year: 2026, industry: 'Retail',
    titleVi: 'Retail Media tại Việt Nam: toàn cảnh 2026', titleEn: 'Retail Media in Vietnam: the 2026 landscape',
    sumVi: 'Thị trường retail media Việt Nam: quy mô, người chơi, xu hướng.',
    sumEn: 'Vietnam retail media: size, players and trends.' },
  { slug: 'footfall-attribution-huong-dan', type: 'paper', year: 2026, industry: 'Measurement',
    titleVi: 'Footfall Attribution — hướng dẫn đo lường', titleEn: 'Footfall Attribution — a measurement guide',
    sumVi: 'Cách đọc đúng số liệu ghé thăm sau chiến dịch.',
    sumEn: 'How to read visit data after a campaign.' },
  { slug: 'wifi-marketing-playbook', type: 'paper', year: 2026, industry: 'Marketing',
    titleVi: 'Wi-Fi Marketing Playbook', titleEn: 'Wi-Fi Marketing Playbook',
    sumVi: 'Cẩm nang triển khai Wi-Fi marketing từ A đến Z.',
    sumEn: 'An A-to-Z playbook for Wi-Fi marketing.' },
  { slug: 'shopper-insights-fmcg', type: 'paper', year: 2025, industry: 'FMCG',
    titleVi: 'Shopper Insights: ngành FMCG', titleEn: 'Shopper Insights: FMCG',
    sumVi: 'Hành vi mua sắm ngành hàng tiêu dùng nhanh qua dữ liệu vị trí.',
    sumEn: 'FMCG shopping behaviour through location data.' },
  { slug: 'case-study-fmcg-brand-recall', type: 'case-study', year: 2026, industry: 'FMCG',
    titleVi: 'Case study: thương hiệu FMCG tăng 340% Brand Recall', titleEn: 'Case study: FMCG brand grows Brand Recall 340%',
    sumVi: 'Chiến dịch Wi-Fi tại 200 điểm bán và kết quả đo được.',
    sumEn: 'A Wi-Fi campaign across 200 stores and the measured results.' },
  { slug: 'case-study-ung-dung-goi-xe', type: 'case-study', year: 2026, industry: 'Technology',
    titleVi: 'Case study: ứng dụng gọi xe đạt 2,4 triệu lượt cài mới', titleEn: 'Case study: ride-hailing app reaches 2.4M new installs',
    sumVi: 'Nhắm mục tiêu theo hành trình di chuyển của người dùng.',
    sumEn: 'Targeting users along their real journeys.' },
  { slug: 'case-study-ngan-hang-so', type: 'case-study', year: 2025, industry: 'Finance',
    titleVi: 'Case study: ngân hàng số đạt ₫18B giá trị giao dịch', titleEn: 'Case study: digital bank reaches ₫18B in transactions',
    sumVi: 'Kích hoạt mở tài khoản tại điểm chạm đông người.',
    sumEn: 'Driving account openings at high-traffic touchpoints.' },
  { slug: 'bao-cao-xu-huong-ooh-2025', type: 'report', year: 2025, industry: 'Media',
    titleVi: 'Báo cáo xu hướng OOH 2025', titleEn: 'OOH trends report 2025',
    sumVi: 'Quảng cáo ngoài trời: từ bảng tĩnh đến dữ liệu.',
    sumEn: 'Out-of-home: from static boards to data.' },
  { slug: 'do-luong-xuyen-kenh', type: 'paper', year: 2026, industry: 'Measurement',
    titleVi: 'Đo lường xuyên kênh cho marketer', titleEn: 'Cross-channel measurement for marketers',
    sumVi: 'Nối online và offline trong một khung đo duy nhất.',
    sumEn: 'Online and offline in a single measurement frame.' },
  { slug: 'cam-nang-quang-cao-tai-diem-ban', type: 'paper', year: 2025, industry: 'Retail',
    titleVi: 'Cẩm nang quảng cáo tại điểm bán', titleEn: 'Point-of-sale advertising handbook',
    sumVi: 'Chọn địa điểm, định dạng và ngân sách cho chiến dịch đầu tiên.',
    sumEn: 'Picking venues, formats and budgets for a first campaign.' },
];

const EVENTS = [
  { slug: 'awing-connect-2026-retail-media-summit', mode: 'offline', location: 'TP.HCM',
    startDate: '2026-12-10T09:00:00.000Z', endDate: '2026-12-10T17:00:00.000Z',
    titleVi: 'AWING Connect 2026: Retail Media Summit', titleEn: 'AWING Connect 2026: Retail Media Summit',
    descVi: 'Ngày hội retail media lớn nhất năm: nhãn hàng, nhà bán lẻ và chuyên gia cùng bàn về tương lai của điểm bán.',
    descEn: 'The biggest retail media day of the year: brands, retailers and experts on the future of the point of sale.' },
  { slug: 'webinar-do-luong-footfall', mode: 'online', location: 'Online',
    startDate: '2026-12-17T14:00:00.000Z', endDate: '2026-12-17T15:30:00.000Z',
    titleVi: 'Webinar: Đo lường footfall cho marketer', titleEn: 'Webinar: Footfall measurement for marketers',
    descVi: 'Buổi chia sẻ trực tuyến về cách đọc số liệu ghé thăm và quy đổi thành quyết định ngân sách.',
    descEn: 'A live session on reading visit data and turning it into budget decisions.' },
  { slug: 'vietnam-ooh-retail-media-forum-2027', mode: 'hybrid', location: 'Hà Nội',
    startDate: '2027-02-25T08:30:00.000Z', endDate: '2027-02-25T17:30:00.000Z',
    titleVi: 'Vietnam OOH & Retail Media Forum 2027', titleEn: 'Vietnam OOH & Retail Media Forum 2027',
    descVi: 'Diễn đàn thường niên về quảng cáo ngoài trời và retail media tại Việt Nam.',
    descEn: 'The annual forum on out-of-home and retail media in Vietnam.' },
  { slug: 'awing-ra-mat-dinh-vi-moi', mode: 'offline', location: 'TP.HCM',
    startDate: '2026-11-05T09:00:00.000Z', endDate: '2026-11-05T11:00:00.000Z',
    titleVi: 'AWING ra mắt định vị mới', titleEn: 'AWING unveils new positioning',
    descVi: 'Sự kiện công bố định vị mới: kết nối thương hiệu với khoảnh khắc đời thực của người tiêu dùng.',
    descEn: 'The launch event for our new positioning: connecting brands with real-world consumer moments.' },
  { slug: 'workshop-wifi-marketing-chuoi-ban-le', mode: 'offline', location: 'Hà Nội',
    startDate: '2026-09-18T13:30:00.000Z', endDate: '2026-09-18T17:00:00.000Z',
    titleVi: 'Workshop: Wi-Fi Marketing cho chuỗi bán lẻ', titleEn: 'Workshop: Wi-Fi Marketing for retail chains',
    descVi: 'Buổi thực hành cho đội ngũ vận hành chuỗi bán lẻ: biến Wi-Fi thành kênh truyền thông.',
    descEn: 'A hands-on session for retail teams: turning Wi-Fi into a media channel.' },
  { slug: 'retail-media-breakfast-2025', mode: 'offline', location: 'TP.HCM',
    startDate: '2025-06-12T08:00:00.000Z', endDate: '2025-06-12T10:00:00.000Z',
    titleVi: 'Retail Media Breakfast 2025', titleEn: 'Retail Media Breakfast 2025',
    descVi: 'Buổi sáng cùng các nhãn hàng FMCG chia sẻ kinh nghiệm triển khai retail media.',
    descEn: 'A morning with FMCG brands sharing retail media lessons.' },
];

const CASE_STUDIES = [
  { slug: 'fmcg-brand-recall-340', industry: 'FMCG', metricLabel: 'Brand Recall', metricValue: 340,
    titleVi: 'Thương hiệu FMCG tăng 340% Brand Recall', titleEn: 'FMCG brand grows Brand Recall 340%',
    sumVi: 'Chiến dịch Wi-Fi tại 200 điểm bán trên 5 thành phố.',
    sumEn: 'A Wi-Fi campaign across 200 stores in 5 cities.' },
  { slug: 'ung-dung-goi-xe-24-trieu-luot-cai', industry: 'Technology', metricLabel: 'New App Installs', metricValue: 2.4,
    titleVi: 'Ứng dụng gọi xe: 2,4 triệu lượt cài mới', titleEn: 'Ride-hailing app: 2.4M new installs',
    sumVi: 'Nhắm mục tiêu theo hành trình di chuyển thực tế.',
    sumEn: 'Targeting real travel journeys.' },
  { slug: 'ngan-hang-so-18b-giao-dich', industry: 'Finance', metricLabel: 'Transaction Volume', metricValue: 18,
    titleVi: 'Ngân hàng số: ₫18B giá trị giao dịch', titleEn: 'Digital bank: ₫18B in transactions',
    sumVi: 'Kích hoạt mở tài khoản tại điểm chạm đông người.',
    sumEn: 'Driving account openings at busy touchpoints.' },
];

const PARTNERS = [
  { slug: 'cafe-aroma', name: 'Café Aroma', category: 'venue', consent: true, website: 'https://example.com/cafe-aroma',
    descVi: 'Chuỗi cà phê 120 cửa hàng trên toàn quốc.', descEn: 'A coffee chain with 120 stores nationwide.' },
  { slug: 'freshmart', name: 'FreshMart', category: 'venue', consent: true, website: 'https://example.com/freshmart',
    descVi: 'Hệ thống siêu thị tại 15 tỉnh thành.', descEn: 'A supermarket chain in 15 provinces.' },
  { slug: 'vista-mall', name: 'Vista Mall', category: 'venue', consent: true, website: 'https://example.com/vista-mall',
    descVi: 'Trung tâm thương mại tại TP.HCM và Hà Nội.', descEn: 'Shopping malls in Ho Chi Minh City and Hanoi.' },
  { slug: 'huong-viet-restaurant', name: 'Nhà hàng Hương Việt', category: 'venue', consent: true, website: 'https://example.com/huong-viet',
    descVi: 'Chuỗi nhà hàng gia đình 40 cửa hàng.', descEn: 'A family restaurant chain with 40 venues.' },
  { slug: 'starcinema', name: 'StarCinema', category: 'venue', consent: true, website: 'https://example.com/starcinema',
    descVi: 'Hệ thống rạp chiếu phim 25 cụm rạp.', descEn: 'A cinema chain with 25 complexes.' },
  { slug: 'dataviet', name: 'DataViet', category: 'strategic', consent: true, website: 'https://example.com/dataviet',
    descVi: 'Đối tác dữ liệu và đo lường.', descEn: 'Data and measurement partner.' },
  { slug: 'mekong-ventures', name: 'Mekong Ventures', category: 'investor', consent: true, website: 'https://example.com/mekong-ventures',
    descVi: 'Quỹ đầu tư đồng hành từ vòng đầu.', descEn: 'An early-stage investment partner.' },
  { slug: 'doi-tac-chua-dong-y', name: 'Đối tác chưa đồng ý', category: 'venue', consent: false, website: '',
    descVi: 'Đối tác chưa đồng ý hiển thị logo (dùng để kiểm tra bộ lọc consent).',
    descEn: 'A partner that has not consented to logo display (used to test the consent filter).' },
];

const CUSTOMERS = [
  { slug: 'freshtea', name: 'FreshTea', industry: 'F&B', caseStudy: 'fmcg-brand-recall-340',
    testiVi: 'AWING giúp chúng tôi đến đúng người uống trà sữa, ngay lúc họ đang chọn quán.',
    testiEn: 'AWING helps us reach bubble tea drinkers right as they pick a shop.' },
  { slug: 'novabank', name: 'NovaBank', industry: 'Finance', caseStudy: 'ngan-hang-so-18b-giao-dich',
    testiVi: 'Số liệu footfall cho chúng tôi biết chi nhánh nào thật sự kéo khách mở tài khoản.',
    testiEn: 'Footfall data shows us which branches really drive account openings.' },
  { slug: 'fastgo', name: 'FastGo', industry: 'Technology', caseStudy: 'ung-dung-goi-xe-24-trieu-luot-cai',
    testiVi: 'Nhắm theo hành trình di chuyển hiệu quả hơn hẳn nhắm theo nhân khẩu học.',
    testiEn: 'Targeting by real journeys beats demographic targeting for us.' },
  { slug: 'lumiere', name: 'Lumière', industry: 'Beauty', caseStudy: null,
    testiVi: 'Quảng cáo tại điểm bán đưa sản phẩm mới đến đúng khách hàng mục tiêu.',
    testiEn: 'Point-of-sale ads put our new products in front of the right shoppers.' },
  { slug: 'techzone', name: 'TechZone', industry: 'Retail', caseStudy: null,
    testiVi: 'Báo cáo theo giờ giúp đội trade thay đổi ưu đãi ngay trong ngày.',
    testiEn: 'Hourly reports let our trade team change offers the same day.' },
  { slug: 'skyviet', name: 'SkyViet', industry: 'Travel', caseStudy: null,
    testiVi: 'Wi-Fi tại sân bay là điểm chạm hoàn hảo cho khách bay nội địa.',
    testiEn: 'Airport Wi-Fi is the perfect touchpoint for domestic flyers.' },
];

const JOBS = [
  { slug: 'senior-frontend-engineer', department: 'Engineering', location: 'TP.HCM', type: 'full-time', deadline: '2027-01-31',
    titleVi: 'Senior Frontend Engineer', titleEn: 'Senior Frontend Engineer',
    descVi: 'Xây giao diện AWING Home Public bằng Next.js, TypeScript và Tailwind.',
    descEn: 'Build the AWING Home Public site with Next.js, TypeScript and Tailwind.' },
  { slug: 'account-manager', department: 'Sales', location: 'TP.HCM', type: 'full-time', deadline: '2027-01-15',
    titleVi: 'Account Manager', titleEn: 'Account Manager',
    descVi: 'Quản lý danh mục nhãn hàng và đồng hành cùng chiến dịch của họ.',
    descEn: 'Manage a portfolio of brands and their campaigns.' },
  { slug: 'data-analyst', department: 'Data', location: 'Hà Nội', type: 'full-time', deadline: '2027-02-15',
    titleVi: 'Data Analyst', titleEn: 'Data Analyst',
    descVi: 'Biến dữ liệu vị trí thành insight cho nhãn hàng và đội sản phẩm.',
    descEn: 'Turn location data into insights for brands and product teams.' },
  { slug: 'marketing-executive', department: 'Marketing', location: 'TP.HCM', type: 'full-time', deadline: '2027-01-31',
    titleVi: 'Marketing Executive', titleEn: 'Marketing Executive',
    descVi: 'Viết nội dung, tổ chức sự kiện và nuôi dưỡng cộng đồng marketer.',
    descEn: 'Write content, run events and grow the marketer community.' },
  { slug: 'operations-specialist', department: 'Operations', location: 'Hà Nội', type: 'contract', deadline: '2027-02-28',
    titleVi: 'Operations Specialist', titleEn: 'Operations Specialist',
    descVi: 'Vận hành mạng lưới địa điểm và hỗ trợ đối tác lắp đặt Wi-Fi.',
    descEn: 'Operate the venue network and support partners installing Wi-Fi.' },
  { slug: 'business-development-intern', department: 'Sales', location: 'TP.HCM', type: 'internship', deadline: '2026-12-31',
    titleVi: 'Business Development Intern', titleEn: 'Business Development Intern',
    descVi: 'Thực tập 6 tháng: tìm kiếm đối tác địa điểm mới cùng đội Sales.',
    descEn: 'A 6-month internship: find new venue partners with the Sales team.' },
];

const FAQS = [
  { slug: 'wifi-co-mien-phi-khong', category: 'Wi-Fi',
    qVi: 'Wi-Fi AWING có miễn phí không?', qEn: 'Is AWING Wi-Fi free?',
    aVi: 'Có. Wi-Fi tại các địa điểm đối tác của AWING hoàn toàn miễn phí cho người dùng — bạn chỉ cần xem một quảng cáo ngắn khi đăng nhập.',
    aEn: 'Yes. Wi-Fi at AWING partner venues is completely free — you just watch a short ad when you log in.' },
  { slug: 'lam-sao-ket-noi-wifi', category: 'Wi-Fi',
    qVi: 'Làm sao để kết nối Wi-Fi tại địa điểm đối tác?', qEn: 'How do I connect to Wi-Fi at a partner venue?',
    aVi: 'Chọn mạng Wi-Fi của địa điểm, mở trình duyệt và làm theo hướng dẫn trên trang đăng nhập. Không cần cài app.',
    aEn: 'Pick the venue Wi-Fi network, open your browser and follow the login page. No app needed.' },
  { slug: 'quang-cao-co-lam-cham-wifi', category: 'Wi-Fi',
    qVi: 'Quảng cáo có làm chậm Wi-Fi không?', qEn: 'Do ads slow down the Wi-Fi?',
    aVi: 'Không. Quảng cáo chỉ hiện lúc đăng nhập, sau đó bạn dùng mạng với tốc độ đầy đủ của địa điểm.',
    aEn: 'No. Ads only appear at login; afterwards you use the venue network at full speed.' },
  { slug: 'awing-thu-thap-du-lieu-gi', category: 'Dữ liệu',
    qVi: 'AWING thu thập dữ liệu gì từ người dùng Wi-Fi?', qEn: 'What data does AWING collect from Wi-Fi users?',
    aVi: 'AWING chỉ thu thập dữ liệu tổng hợp, ẩn danh về lượt kết nối và mức tương tác — không thu thập tọa độ thô hay nội dung truy cập của bạn.',
    aEn: 'AWING only collects aggregated, anonymous data on connections and engagement — never raw coordinates or your browsing content.' },
  { slug: 'lam-sao-chay-chien-dich', category: 'Quảng cáo',
    qVi: 'Làm sao để chạy chiến dịch quảng cáo với AWING?', qEn: 'How do I run an ad campaign with AWING?',
    aVi: 'Điền form nhận dữ liệu trên website, đội ngũ AWING sẽ liên hệ tư vấn địa điểm, định dạng và ngân sách phù hợp.',
    aEn: 'Fill in the Get data form on this site and the AWING team will advise on venues, formats and budget.' },
  { slug: 'chi-phi-quang-cao', category: 'Quảng cáo',
    qVi: 'Chi phí quảng cáo được tính như thế nào?', qEn: 'How is advertising priced?',
    aVi: 'Chi phí phụ thuộc vào địa điểm, thời lượng và lượt hiển thị. Bạn nhận báo giá chi tiết sau khi gửi yêu cầu.',
    aEn: 'Pricing depends on venues, duration and impressions. You get a detailed quote after sending a request.' },
  { slug: 'nham-muc-tieu-theo-khu-vuc', category: 'Quảng cáo',
    qVi: 'Tôi có thể nhắm mục tiêu theo khu vực không?', qEn: 'Can I target by area?',
    aVi: 'Có. Bạn chọn tỉnh/thành, quận, loại địa điểm và bán kính — quảng cáo chỉ hiện ở nơi bạn chọn.',
    aEn: 'Yes. Pick provinces, districts, venue types and a radius — ads only appear where you choose.' },
  { slug: 'awing-do-luong-hieu-qua', category: 'Dữ liệu',
    qVi: 'AWING đo lường hiệu quả chiến dịch ra sao?', qEn: 'How does AWING measure campaign effectiveness?',
    aVi: 'Bằng dữ liệu vị trí thực: lượt ghé cửa hàng (footfall), mức tăng nhận biết thương hiệu và chuyển đổi offline.',
    aEn: 'With real location data: store visits (footfall), brand lift and offline conversion.' },
  { slug: 'du-lieu-co-duoc-ban', category: 'Dữ liệu',
    qVi: 'Dữ liệu của tôi có được bán cho bên thứ ba không?', qEn: 'Is my data sold to third parties?',
    aVi: 'Không. AWING không bán dữ liệu cá nhân. Dữ liệu chia sẻ với nhãn hàng luôn ở dạng tổng hợp, ẩn danh.',
    aEn: 'No. AWING never sells personal data. Data shared with brands is always aggregated and anonymous.' },
  { slug: 'tro-thanh-doi-tac-dia-diem', category: 'Quảng cáo',
    qVi: 'Làm sao để trở thành đối tác địa điểm của AWING?', qEn: 'How do I become an AWING venue partner?',
    aVi: 'Gửi yêu cầu qua form liên hệ, đội ngũ sẽ khảo sát địa điểm và lắp đặt Wi-Fi miễn phí cho bạn.',
    aEn: 'Send a request via the contact form; our team surveys your venue and installs Wi-Fi free of charge.' },
  { slug: 'awing-co-mat-o-dau', category: 'Wi-Fi',
    qVi: 'AWING có mặt ở những tỉnh thành nào?', qEn: 'Which provinces is AWING in?',
    aVi: 'AWING phủ 63 tỉnh thành với hơn 10.900 địa điểm — xem bản đồ phủ sóng trên trang Data.',
    aEn: 'AWING covers 63 provinces with 10,900+ venues — see the coverage map on the Data page.' },
  { slug: 'ngung-nhan-email', category: 'Wi-Fi',
    qVi: 'Tôi muốn ngừng nhận email từ AWING thì làm sao?', qEn: 'How do I stop AWING emails?',
    aVi: 'Bấm link hủy đăng ký ở cuối mỗi email, hoặc gửi yêu cầu về hello@awing.vn.',
    aEn: 'Click unsubscribe at the bottom of any email, or write to hello@awing.vn.' },
];

// ---------------------------------------------------------------------------
// 118 bài News (BE 7 — bản giả lập; bản thật chờ BA giao bản xuất site cũ)
// Tiêu đề sinh từ 24 mẫu × 5 thành phố = 120 tổ hợp, lấy 118 bài đầu.
// ---------------------------------------------------------------------------
const NEWS_CITIES_VI = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
const NEWS_CITIES_EN = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'];
const NEWS_TOPICS = ['Retail Media', 'Footfall Attribution', 'Wi-Fi Marketing', 'OOH', 'Shopper Insights', 'Measurement'];
const NEWS_TEMPLATES = [
  ['AWING mở rộng mạng Wi-Fi tại {city}', 'AWING expands its Wi-Fi network in {city}'],
  ['Retail media lên ngôi tại {city}: khi điểm bán thành kênh truyền thông', 'Retail media rises in {city}: when stores become media'],
  ['Đo lường footfall tại {city}: {topic} giúp nhãn hàng đọc đúng hiệu quả', 'Measuring footfall in {city}: {topic} helps brands read real impact'],
  ['AWING ra mắt báo cáo {topic} 2026', 'AWING releases the 2026 {topic} report'],
  ['Người tiêu dùng {city} tương tác với quảng cáo ngoài trời ra sao?', 'How do consumers in {city} engage with outdoor ads?'],
  ['{topic}: xu hướng marketer Việt không thể bỏ qua', '{topic}: a trend Vietnamese marketers cannot ignore'],
  ['AWING hợp tác cùng chuỗi bán lẻ lớn tại {city}', 'AWING partners with a major retail chain in {city}'],
  ['Wi-Fi marketing tại {city}: từ điểm chạm thành điểm mua', 'Wi-Fi marketing in {city}: from touchpoint to purchase'],
  ['Case study: {topic} giúp nhãn hàng tăng 2,4 lần lượt cài app', 'Case study: {topic} helps a brand grow app installs 2.4x'],
  ['AWING công bố chỉ số {topic} quý mới nhất', 'AWING publishes the latest quarterly {topic} index'],
  ['Sự kiện {topic} sắp diễn ra tại {city}', '{topic} event coming soon to {city}'],
  ['Nhìn lại 2025: {topic} và những con số biết nói', 'Looking back at 2025: {topic} in numbers'],
  ['{city} dẫn đầu cả nước về mức độ tương tác Wi-Fi', '{city} leads the country in Wi-Fi engagement'],
  ['Shopper marketing: 5 bài học từ các chiến dịch tại {city}', 'Shopper marketing: 5 lessons from campaigns in {city}'],
  ['AWING đạt cột mốc {n} triệu lượt đăng nhập Wi-Fi', 'AWING reaches {n} million Wi-Fi logins'],
  ['Đo lường xuyên kênh: {topic} kết nối online và offline', 'Cross-channel measurement: {topic} connects online and offline'],
  ['Quảng cáo tại sân bay: cơ hội mới cho nhãn hàng cao cấp', 'Airport advertising: a new opportunity for premium brands'],
  ['AWING mở văn phòng mới tại {city}', 'AWING opens a new office in {city}'],
  ['{topic} và hành trình mua sắm của Gen Z tại {city}', '{topic} and Gen Z shopping journeys in {city}'],
  ['Từ dữ liệu đến quyết định: {topic} trong tay marketer', 'From data to decisions: {topic} for marketers'],
  ['AWING đồng hành cùng lễ hội mua sắm lớn nhất năm tại {city}', 'AWING joins the biggest shopping festival of the year in {city}'],
  ['Tương lai của quảng cáo địa điểm: góc nhìn từ {topic}', 'The future of location advertising: a {topic} perspective'],
  ['AWING nhận giải thưởng {topic} khu vực châu Á', 'AWING wins a regional Asia award for {topic}'],
  ['Bản đồ nhiệt tương tác: {city} có gì khác biệt?', 'Engagement heatmap: what makes {city} different?'],
];
const NEWS_CATEGORIES_VI = ['Tin tức', 'Báo cáo', 'Sự kiện', 'Case study'];
const NEWS_CATEGORIES_EN = ['News', 'Reports', 'Events', 'Case studies'];

function buildNews() {
  const items = [];
  for (let i = 0; i < 118; i++) {
    const t = NEWS_TEMPLATES[i % 24];
    const cityIdx = Math.floor(i / 24) % 5;
    const topic = NEWS_TOPICS[i % 6];
    const n = 20 + (i % 10);
    const fill = (s, city) => s.replaceAll('{city}', city).replaceAll('{topic}', topic).replaceAll('{n}', String(n));
    const titleVi = fill(t[0], NEWS_CITIES_VI[cityIdx]);
    const titleEn = fill(t[1], NEWS_CITIES_EN[cityIdx]);
    // Ngày rải đều 2024-01 → 2026-11 (mỗi bài cách nhau ~8 ngày).
    const d = new Date(Date.UTC(2024, 0, 3 + i * 8));
    const date = d.toISOString().slice(0, 10);
    items.push({
      slug: `news-${String(i + 1).padStart(3, '0')}`,
      titleVi, titleEn,
      categoryVi: NEWS_CATEGORIES_VI[i % 4], categoryEn: NEWS_CATEGORIES_EN[i % 4],
      publishedDate: date,
      bodyVi: `${titleVi} Bài viết giới thiệu bối cảnh, số liệu chính và ý nghĩa với nhãn hàng đang chạy chiến dịch tại Việt Nam.`,
      bodyEn: `${titleEn} This article covers the background, key figures and what it means for brands running campaigns in Vietnam.`,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Single types
// ---------------------------------------------------------------------------
const SNAPSHOT = {
  snapshotDate: '2026-11-23',
  noteVi: 'Số liệu minh hoạ (dữ liệu giả lập R1) — cập nhật hàng ngày.',
  noteEn: 'Illustrative figures (R1 fake data) — updated daily.',
  metrics: [
    { id: 'connections', value: 25400000, labelVi: 'Lượt kết nối', labelEn: 'Connections', trend: '+100.000/kỳ' },
    { id: 'provinces', value: 63, labelVi: 'Tỉnh thành', labelEn: 'Provinces', trend: null },
    { id: 'chains', value: 195, labelVi: 'Chuỗi đối tác', labelEn: 'Partner chains', trend: null },
    { id: 'venues', value: 10953, labelVi: 'Địa điểm', labelEn: 'Venues', trend: null },
    { id: 'wifiLogins30d', value: 48200000, labelVi: 'Lượt đăng nhập Wi-Fi / 30 ngày', labelEn: 'Wi-Fi logins / 30 days', trend: null },
    { id: 'adViews', value: 131700000, labelVi: 'Lượt xem quảng cáo', labelEn: 'Ad views', trend: null },
  ],
};

const GLOBAL = {
  siteName: 'AWING',
  contactEmail: 'hello@awing.vn',
  socialLinks: [
    { platform: 'facebook', url: 'https://www.facebook.com/awingvietnam' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/company/awing-vietnam' },
    { platform: 'youtube', url: 'https://www.youtube.com/@awingvietnam' },
    { platform: 'zalo', url: 'https://zalo.me/awingvietnam' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@awingvietnam' },
  ],
};

const HOME = {
  heroTitleVi: 'Connecting Brands with Real-World Consumer Moments',
  heroTitleEn: 'Connecting Brands with Real-World Consumer Moments',
  heroSubtitleVi: 'Quảng cáo theo vị trí thực: đến đúng người, đúng nơi, đúng lúc họ ra quyết định.',
  heroSubtitleEn: 'Location-based advertising: reach the right people, in the right place, at the moment they decide.',
  statsNoteVi: 'Số liệu minh hoạ — cập nhật hàng ngày.',
  statsNoteEn: 'Illustrative figures — updated daily.',
  howItWorks: [
    { stepTitleVi: 'Chọn địa điểm', stepTitleEn: 'Pick venues', stepTextVi: 'Chọn tỉnh thành, loại địa điểm và bán kính trên bản đồ.', stepTextEn: 'Pick provinces, venue types and a radius on the map.' },
    { stepTitleVi: 'Tạo chiến dịch', stepTitleEn: 'Build the campaign', stepTextVi: 'Chọn định dạng quảng cáo và ngân sách phù hợp.', stepTextEn: 'Choose ad formats and a budget that fits.' },
    { stepTitleVi: 'Đo lường kết quả', stepTitleEn: 'Measure results', stepTextVi: 'Xem footfall và chuyển đổi theo thời gian thực.', stepTextEn: 'Watch footfall and conversions in real time.' },
  ],
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
async function countDocs(app, uid, locale = 'vi') {
  const docs = await app.documents(uid).findMany({ locale, status: 'published', limit: 1 });
  return docs.length;
}

async function deleteAll(app, uid) {
  // Luôn lấy trang đầu của phần còn lại (không tăng page — sau khi xoá,
  // thứ tự dịch chuyển nên tăng page sẽ bỏ sót).
  for (const locale of ['vi', 'en']) {
    for (;;) {
      const docs = await app.documents(uid).findMany({ locale, limit: 100 });
      if (!docs.length) break;
      for (const d of docs) {
        await app.documents(uid).delete({ documentId: d.documentId });
      }
    }
  }
}

// Tạo bản vi rồi thêm bản en (cùng documentId). Trả về documentId.
async function createBilingual(app, uid, viData, enData) {
  const created = await app.documents(uid).create({ data: viData, locale: 'vi', status: 'published' });
  if (enData) {
    await app.documents(uid).update({
      documentId: created.documentId, locale: 'en', data: enData, status: 'published',
    });
  }
  return created.documentId;
}

function productBlocks(p, solutions, lang = 'vi') {
  const goal = lang === 'vi' ? p.goalVi : p.goalEn;
  const desc = lang === 'vi' ? p.descVi : p.descEn;
  const items = solutions.map((s) => ({
    name: s.name, summary: lang === 'vi' ? s.sumVi : s.sumEn, href: `/products/${p.slug}/${s.slug}`,
  }));
  const t = (vi, en) => (lang === 'vi' ? vi : en);
  return [
    { __component: 'blocks.block-hero', title: p.name, subtitle: p.slogan, eyebrow: 'AWING Product', ctaLabel: 'Get data', ctaHref: '/contact' },
    { __component: 'blocks.block-opportunity', items: [
      { title: goal, text: desc },
      { title: t('Dữ liệu thật', 'Real data'), text: t('Đo lường bằng lượt ghé thăm và giao dịch thực, không ước lượng.', 'Measured by real visits and transactions, not estimates.') },
      { title: t('Phủ sóng toàn quốc', 'Nationwide coverage'), text: t('63 tỉnh thành, hơn 10.900 địa điểm.', '63 provinces, 10,900+ venues.') },
    ] },
    { __component: 'blocks.block-solutions', items },
    { __component: 'blocks.block-how-to-plan', steps: [
      { title: t('Chọn địa điểm', 'Pick venues'), text: t('Chọn tỉnh thành và loại địa điểm.', 'Pick provinces and venue types.') },
      { title: t('Chọn solution', 'Pick solutions'), text: t('Ghép các solution theo mục tiêu chiến dịch.', 'Combine solutions for your campaign goal.') },
      { title: t('Chạy và đo lường', 'Run and measure'), text: t('Theo dõi footfall theo thời gian thực.', 'Track footfall in real time.') },
    ] },
    { __component: 'blocks.block-showcase', items: [
      { title: t('Báo cáo Vietnam Offline Attention 2026', 'Vietnam Offline Attention Report 2026'), summary: t('Toàn cảnh sự chú ý ngoài đời thực.', 'The full picture of real-world attention.'), href: '/resources/bao-cao-vietnam-offline-attention-2026' },
      { title: t('Case study: thương hiệu FMCG tăng 340% Brand Recall', 'Case study: FMCG brand grows Brand Recall 340%'), summary: t('Chiến dịch Wi-Fi tại 200 điểm bán.', 'A Wi-Fi campaign across 200 stores.'), href: '/resources/case-study-fmcg-brand-recall' },
    ] },
    { __component: 'blocks.block-lead-form', title: t('Nhận dữ liệu chi tiết', 'Get detailed data') },
  ];
}

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  try {
    const U = {
      product: 'api::product.product',
      solution: 'api::solution.solution',
      adFormat: 'api::ad-format.ad-format',
      resource: 'api::resource.resource',
      event: 'api::event.event',
      article: 'api::article.article',
      job: 'api::job.job',
      partner: 'api::partner.partner',
      customer: 'api::customer.customer',
      caseStudy: 'api::case-study.case-study',
      faq: 'api::faq.faq',
      snapshot: 'api::data-snapshot.data-snapshot',
      global: 'api::global.global',
      home: 'api::home.home',
    };
    const productIds = {};
    const solutionIds = {};
    const caseStudyIds = {};

    // --- Products (kèm blocks; solutions nối sau) ---
    if (FORCE) await deleteAll(app, U.product);
    if ((await countDocs(app, U.product)) === 0) {
      for (const p of PRODUCTS) {
        const sols = SOLUTIONS.filter((s) => s.product === p.slug);
        const id = await createBilingual(app, U.product,
          { name: p.name, slug: p.slug, tagline: p.taglineVi, goal: p.goalVi, description: p.descVi,
            color: p.color, order: p.order, market: 'vn', blocks: productBlocks(p, sols, 'vi') },
          { name: p.name, slug: p.slug, tagline: p.taglineEn, goal: p.goalEn, description: p.descEn,
            color: p.color, order: p.order, market: 'vn', blocks: productBlocks(p, sols, 'en') });
        productIds[p.slug] = id;
      }
      log(`products: ${PRODUCTS.length}`);
    } else {
      const all = await app.documents(U.product).findMany({ locale: 'vi', status: 'published', limit: 100 });
      for (const d of all) productIds[d.slug] = d.documentId;
      log(`products: đã có ${all.length}, bỏ qua`);
    }

    // --- Solutions (nối product) ---
    if (FORCE) await deleteAll(app, U.solution);
    if ((await countDocs(app, U.solution)) === 0) {
      for (const s of SOLUTIONS) {
        const id = await createBilingual(app, U.solution,
          { name: s.name, slug: s.slug, summary: s.sumVi, product: productIds[s.product], market: 'vn',
            blocks: [{ __component: 'blocks.block-rich-text', text: rt(s.sumVi, 'Chi tiết solution sẽ do editor bổ sung.') }] },
          { name: s.name, slug: s.slug, summary: s.sumEn, product: productIds[s.product], market: 'vn',
            blocks: [{ __component: 'blocks.block-rich-text', text: rt(s.sumEn, 'Solution details to be added by editors.') }] });
        solutionIds[s.slug] = id;
      }
      log(`solutions: ${SOLUTIONS.length}`);
    } else {
      // Đã có sẵn: lấy map slug -> documentId để nối product.
      const all = await app.documents(U.solution).findMany({ locale: 'vi', status: 'published', limit: 100 });
      for (const d of all) solutionIds[d.slug] = d.documentId;
      log(`solutions: đã có ${all.length}, bỏ qua`);
    }

    // Nối solutions vào product (relation theo từng locale — đặt ở cả vi và en).
    if (Object.keys(solutionIds).length) {
      for (const p of PRODUCTS) {
        const ids = SOLUTIONS.filter((s) => s.product === p.slug).map((s) => solutionIds[s.slug]).filter(Boolean);
        if (ids.length && productIds[p.slug]) {
          for (const locale of ['vi', 'en']) {
            await app.documents(U.product).update({
              documentId: productIds[p.slug], locale,
              data: { solutions: ids }, status: 'published',
            });
          }
        }
      }
      log('products: đã nối solutions (vi+en)');
    }

    // --- AdFormats ---
    if (FORCE) await deleteAll(app, U.adFormat);
    if ((await countDocs(app, U.adFormat)) === 0) {
      for (const f of AD_FORMATS) {
        await createBilingual(app, U.adFormat,
          { name: f.name, slug: f.slug, description: f.descVi, formatType: f.formatType, durationSeconds: f.durationSeconds,
            metricLabel: f.metricLabel, metricValue: f.metricValue, solution: solutionIds[f.solution], market: 'vn' },
          { name: f.name, slug: f.slug, description: f.descEn, formatType: f.formatType, durationSeconds: f.durationSeconds,
            metricLabel: f.metricLabel, metricValue: f.metricValue, solution: solutionIds[f.solution], market: 'vn' });
      }
      log(`ad-formats: ${AD_FORMATS.length}`);
    } else log('ad-formats: đã có dữ liệu, bỏ qua');

    // --- Case studies (trước customers để nối relation) ---
    if (FORCE) await deleteAll(app, U.caseStudy);
    if ((await countDocs(app, U.caseStudy)) === 0) {
      for (const c of CASE_STUDIES) {
        const id = await createBilingual(app, U.caseStudy,
          { title: c.titleVi, slug: c.slug, summary: c.sumVi, industry: c.industry, metricLabel: c.metricLabel,
            metricValue: c.metricValue, market: 'vn' },
          { title: c.titleEn, slug: c.slug, summary: c.sumEn, industry: c.industry, metricLabel: c.metricLabel,
            metricValue: c.metricValue, market: 'vn' });
        caseStudyIds[c.slug] = id;
      }
      log(`case-studies: ${CASE_STUDIES.length}`);
    } else {
      const all = await app.documents(U.caseStudy).findMany({ locale: 'vi', status: 'published', limit: 100 });
      for (const d of all) caseStudyIds[d.slug] = d.documentId;
      log(`case-studies: đã có ${all.length}, bỏ qua`);
    }

    // --- Resources ---
    if (FORCE) await deleteAll(app, U.resource);
    if ((await countDocs(app, U.resource)) === 0) {
      for (const r of RESOURCES) {
        await createBilingual(app, U.resource,
          { title: r.titleVi, slug: r.slug, summary: r.sumVi, type: r.type, industry: r.industry,
            publishedDate: `${r.year}-06-15`,
            content: rt(r.sumVi, 'Nội dung đầy đủ của tài liệu (bản giả lập R1).'), market: 'vn' },
          { title: r.titleEn, slug: r.slug, summary: r.sumEn, type: r.type, industry: r.industry,
            publishedDate: `${r.year}-06-15`,
            content: rt(r.sumEn, 'Full document content (R1 fake data).'), market: 'vn' });
      }
      log(`resources: ${RESOURCES.length}`);
    } else log('resources: đã có dữ liệu, bỏ qua');

    // --- Events ---
    if (FORCE) await deleteAll(app, U.event);
    if ((await countDocs(app, U.event)) === 0) {
      for (const e of EVENTS) {
        const agenda = [
          { time: '09:00', title: 'Đón khách & check-in' },
          { time: '09:30', title: 'Keynote: xu hướng quảng cáo theo vị trí' },
          { time: '11:00', title: 'Thảo luận & networking' },
        ];
        const speakers = [
          { name: 'Nguyễn Văn An', role: 'Head of Marketing', company: 'AWING' },
          { name: 'Trần Thị Bình', role: 'Retail Media Lead', company: 'AWING' },
        ];
        await createBilingual(app, U.event,
          { title: e.titleVi, slug: e.slug, description: rt(e.descVi), startDate: e.startDate, endDate: e.endDate,
            mode: e.mode, location: e.location, agenda, speakers, market: 'vn' },
          { title: e.titleEn, slug: e.slug, description: rt(e.descEn), startDate: e.startDate, endDate: e.endDate,
            mode: e.mode, location: e.location, agenda, speakers, market: 'vn' });
      }
      log(`events: ${EVENTS.length}`);
    } else log('events: đã có dữ liệu, bỏ qua');

    // --- Articles / News: 118 bài ---
    if (FORCE) await deleteAll(app, U.article);
    if ((await countDocs(app, U.article)) === 0) {
      const news = buildNews();
      let done = 0;
      for (const n of news) {
        await createBilingual(app, U.article,
          { title: n.titleVi, slug: n.slug, category: n.categoryVi, publishedDate: n.publishedDate,
            content: rt(n.bodyVi, 'Nội dung bài viết (bản giả lập R1 — chờ bản xuất dữ liệu thật từ site cũ).'), market: 'vn' },
          { title: n.titleEn, slug: n.slug, category: n.categoryEn, publishedDate: n.publishedDate,
            content: rt(n.bodyEn, 'Article body (R1 fake data — awaiting the real export from the old site).'), market: 'vn' });
        done += 1;
        if (done % 20 === 0) log(`articles: ${done}/118...`);
      }
      log('articles: 118');
    } else log('articles: đã có dữ liệu, bỏ qua');

    // --- Jobs ---
    if (FORCE) await deleteAll(app, U.job);
    if ((await countDocs(app, U.job)) === 0) {
      for (const j of JOBS) {
        await createBilingual(app, U.job,
          { title: j.titleVi, slug: j.slug, department: j.department, location: j.location,
            type: j.type, deadline: j.deadline,
            description: rt(j.descVi), requirements: rt('Yêu cầu chi tiết sẽ do HR bổ sung.'), market: 'vn' },
          { title: j.titleEn, slug: j.slug, department: j.department, location: j.location,
            type: j.type, deadline: j.deadline,
            description: rt(j.descEn), requirements: rt('Detailed requirements to be added by HR.'), market: 'vn' });
      }
      log(`jobs: ${JOBS.length}`);
    } else log('jobs: đã có dữ liệu, bỏ qua');

    // --- Partners ---
    if (FORCE) await deleteAll(app, U.partner);
    if ((await countDocs(app, U.partner)) === 0) {
      for (const p of PARTNERS) {
        await createBilingual(app, U.partner,
          { name: p.name, slug: p.slug, category: p.category, description: p.descVi,
            website: p.website, consent: p.consent, market: 'vn' },
          { name: p.name, slug: p.slug, category: p.category, description: p.descEn,
            website: p.website, consent: p.consent, market: 'vn' });
      }
      log(`partners: ${PARTNERS.length} (1 consent=false để kiểm tra bộ lọc)`);
    } else log('partners: đã có dữ liệu, bỏ qua');

    // --- Customers ---
    if (FORCE) await deleteAll(app, U.customer);
    if ((await countDocs(app, U.customer)) === 0) {
      for (const c of CUSTOMERS) {
        await createBilingual(app, U.customer,
          { name: c.name, slug: c.slug, industry: c.industry, testimonial: c.testiVi,
            caseStudy: c.caseStudy ? caseStudyIds[c.caseStudy] : undefined, market: 'vn' },
          { name: c.name, slug: c.slug, industry: c.industry, testimonial: c.testiEn,
            caseStudy: c.caseStudy ? caseStudyIds[c.caseStudy] : undefined, market: 'vn' });
      }
      log(`customers: ${CUSTOMERS.length}`);
    } else log('customers: đã có dữ liệu, bỏ qua');

    // --- FAQ: 12 ---
    if (FORCE) await deleteAll(app, U.faq);
    if ((await countDocs(app, U.faq)) === 0) {
      let order = 1;
      for (const f of FAQS) {
        await createBilingual(app, U.faq,
          { question: f.qVi, slug: f.slug, answer: rt(f.aVi), category: f.category, order: order, market: 'vn' },
          { question: f.qEn, slug: f.slug, answer: rt(f.aEn), category: f.category, order: order, market: 'vn' });
        order += 1;
      }
      log(`faqs: ${FAQS.length}`);
    } else log('faqs: đã có dữ liệu, bỏ qua');

    // --- Singles ---
    for (const [uid, viData, enData, label] of [
      [U.snapshot,
        { snapshotDate: SNAPSHOT.snapshotDate, note: SNAPSHOT.noteVi, metrics: SNAPSHOT.metrics },
        { snapshotDate: SNAPSHOT.snapshotDate, note: SNAPSHOT.noteEn, metrics: SNAPSHOT.metrics },
        'data-snapshot'],
      [U.global,
        { siteName: GLOBAL.siteName, contactEmail: GLOBAL.contactEmail, socialLinks: GLOBAL.socialLinks },
        { siteName: GLOBAL.siteName, contactEmail: GLOBAL.contactEmail, socialLinks: GLOBAL.socialLinks },
        'global'],
      [U.home,
        { heroTitle: HOME.heroTitleVi, heroSubtitle: HOME.heroSubtitleVi, statsNote: HOME.statsNoteVi,
          howItWorks: HOME.howItWorks.map((s) => ({ stepTitle: s.stepTitleVi, stepText: s.stepTextVi })) },
        { heroTitle: HOME.heroTitleEn, heroSubtitle: HOME.heroSubtitleEn, statsNote: HOME.statsNoteEn,
          howItWorks: HOME.howItWorks.map((s) => ({ stepTitle: s.stepTitleEn, stepText: s.stepTextEn })) },
        'home'],
    ]) {
      const existing = await app.documents(uid).findFirst({ locale: 'vi', status: 'published' });
      if (existing && !FORCE) { log(`${label}: đã có dữ liệu, bỏ qua`); continue; }
      if (existing) {
        await app.documents(uid).update({ documentId: existing.documentId, locale: 'vi', data: viData, status: 'published' });
        await app.documents(uid).update({ documentId: existing.documentId, locale: 'en', data: enData, status: 'published' });
      } else {
        await createBilingual(app, uid, viData, enData);
      }
      log(`${label}: xong`);
    }

    log('SEED DONE');
  } finally {
    await app.destroy();
  }
}

main().catch((e) => { console.error('[seed] FAILED', e); process.exit(1); });
