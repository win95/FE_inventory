// Từ điển giao diện VI/EN + locale hiện tại.
//
// Ngôn ngữ mặc định là vi (khớp locale mặc định của Strapi). Nút EN trên
// header đổi locale; locale được lưu localStorage nên lần sau mở lại vẫn
// giữ. Đổi locale thì Frontend gọi lại API với locale mới — Strapi qua
// ?locale=, FastAPI qua ?locale= (coverage) / body locale (suggest) — nên
// cả chữ cứng lẫn nội dung dưới backend đều đổi theo, không chỉ đổi chữ
// trên giao diện. Chữ nào lấy từ dữ liệu (tên chuỗi, ngành, số liệu) thì
// giữ nguyên ngôn ngữ của dữ liệu đó.
//
// Lưu ý: metadata trong layout.tsx vẫn cố định tiếng Việt (Next.js
// metadata là tĩnh theo build, không theo locale của người dùng).
export type Locale = "vi" | "en";

export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_STORAGE_KEY = "awing_locale";

const vi = {
  "nav.main": "Điều hướng chính",
  "nav.noDestination": "Chưa có trang đích — để sau",
  "nav.partners": "Đối tác",
  "nav.trusted": "Tin dùng",
  "nav.switchLanguage": "Chuyển ngôn ngữ giao diện",
  "auth.signInGoogle": "Đăng nhập với Google",
  "auth.signOut": "Đăng xuất",
  "auth.googleUnavailable":
    "Đăng nhập Google do backend xác thực — backend chưa được cấu hình nên tạm thời chưa dùng được.",
  "hero.titleA": "Kênh marketing theo vị trí — tiếp cận người dùng",
  "hero.titleB": "ngay tại địa điểm họ đang ở",
  "hero.subtitleA":
    "Mô tả chiến dịch bằng câu thường, nhận gợi ý địa điểm và hình thức quảng cáo phù hợp, rồi",
  "hero.subtitleB": "chạy và đo lường theo thời gian thực",
  "hero.example": "Ví dụ: chiến dịch cà phê cao cấp tại TP. Hồ Chí Minh và Hà Nội.",
  "hero.promptLabel": "Nhập ý tưởng cho chiến dịch",
  "hero.promptPlaceholder": "Nhập ý tưởng cho chiến dịch…",
  "stats.connections": "Lượt kết nối",
  "stats.provinces": "Tỉnh thành phố",
  "stats.chains": "Chuỗi hệ thống",
  "stats.venues": "Địa điểm phủ sóng",
  "stats.emptyTitle": "Chưa có số liệu mạng lưới",
  "stats.noBackend":
    "Chưa kết nối được backend — cấu hình NEXT_PUBLIC_API_BASE_URL và chạy backend FastAPI + SQLite.",
  "stats.emptyDb":
    "Database chưa có số liệu. Thêm bản ghi vào SQLite thì các ô số liệu sẽ hiện ở đây.",
  "stats.errorTitle": "Không tải được số liệu mạng lưới",
  "stats.realtimeNote": "Số liệu cập nhật theo thời gian thực từ backend (trễ tối đa 1 phút).",
  "common.retry": "Thử lại",
  "common.loading": "Đang tải…",
  "common.sendFailed": "Gửi không thành công. Thử lại sau.",
  "common.close": "Đóng",
  "common.sending": "Đang gửi…",
  "a11y.networkStats": "Số liệu mạng lưới",
  "a11y.selectedCities": "Thành phố đã chọn",
  "a11y.suggestedFormats": "Định dạng quảng cáo gợi ý",
  "coverage.description":
    "Mức phủ sóng theo tỉnh/thành và theo loại địa điểm, lấy trực tiếp từ database qua API — thay đổi dữ liệu trong SQLite thì bản đồ đổi theo.",
  "coverage.emptyTitle": "Chưa có dữ liệu phủ sóng",
  "coverage.emptyBody":
    "Thêm tỉnh/thành và số điểm theo loại venue vào SQLite thì bản đồ nhiệt sẽ hiện ở đây.",
  "coverage.loadFailed": "Không tải được dữ liệu phủ sóng",
  "how.title1": "Mô tả chiến dịch",
  "how.desc1": "Mô tả chiến dịch bằng câu thường — không cần brief hay bảng tính.",
  "how.title2": "Nhận gợi ý",
  "how.desc2": "Nhận gợi ý địa điểm, venue và hình thức quảng cáo dựa trên dữ liệu phủ sóng.",
  "how.title3": "Chạy & đo lường",
  "how.desc3": "Chạy chiến dịch và đo lường engagement, reach, conversion theo thời gian thực.",
  "lead.title": "Để lại thông tin — chúng tôi liên hệ lại",
  "lead.subtitle": "Dành cho nhà quảng cáo, chủ sở hữu Wi-Fi và đối tác muốn hợp tác.",
  "lead.sentTitle": "Đã nhận thông tin của bạn.",
  "lead.sentBody": "Chúng tôi sẽ liên hệ lại sớm. Cảm ơn bạn đã quan tâm tới AWING.",
  "form.name": "Họ tên *",
  "form.phone": "Số điện thoại *",
  "form.message": "Tin nhắn *",
  "form.send": "Gửi",
  "form.sendLead": "Gửi thông tin",
  "footer.about":
    "Kênh marketing theo vị trí trên di động tại Việt Nam — kết nối thương hiệu tới người dùng qua Wi-Fi tại địa điểm.",
  "footer.quickLinks": "Liên kết nhanh",
  "footer.home": "Trang chủ",
  "footer.contact": "Liên hệ",
  "contact.hq": "Trụ sở chính: ",
  "contact.branch": "Văn phòng chi nhánh: ",
  "contact.ads": "Liên hệ quảng cáo: ",
  "contact.network": "Hợp tác mạng lưới: ",
  "contact.support": "Hỗ trợ người dùng & Wi-Fi: ",
  "contactPage.title": "Liên hệ với chúng tôi",
  "contactPage.subtitle":
    "Cho dù bạn là nhà quảng cáo, chủ sở hữu Wi-Fi hay đối tác tiềm năng, chúng tôi luôn sẵn sàng trả lời các câu hỏi của bạn và khám phá các cơ hội hợp tác.",
  "contactPage.sentTitle": "Đã gửi tin nhắn của bạn.",
  "contactPage.sentBody": "Chúng tôi sẽ phản hồi sớm nhất có thể. Cảm ơn bạn đã liên hệ.",
  "contactPage.typeLabel": "Loại yêu cầu *",
  "contactPage.typeAds": "Liên hệ quảng cáo",
  "contactPage.typeNetwork": "Hợp tác phát triển mạng lưới",
  "contactPage.typeSupport": "Hỗ trợ người dùng & kết nối Wi-Fi",
  "contactPage.typeOther": "Khác",
  "contactPage.asideTitle": "Địa điểm & liên hệ",
  "adv.editLabel": "Sửa ý tưởng chiến dịch",
  "adv.cancel": "Hủy",
  "adv.loadingResults": "Đang tải kết quả",
  "adv.noPrompt": "Chưa có prompt để gợi ý",
  "adv.noResult": "Chưa có kết quả phù hợp",
  "adv.noPromptHint": "Nhập ý tưởng chiến dịch ở trang chủ rồi bấm Get Suggestions.",
  "adv.noResultHint":
    "Backend chưa có địa điểm/format phù hợp với prompt này trong SQLite. Thử prompt khác, hoặc thêm dữ liệu vào database.",
  "adv.loadFailed": "Không tải được kết quả gợi ý",
  "adv.loadFailedFallback": "Không tải được kết quả gợi ý.",
  "adv.totalReach": "Tổng Reach",
  "adv.potentialEngagements": "Tương tác tiềm năng",
  "adv.impressionsPerDay": "Lượt hiển thị/ngày (ước tính)",
  "adv.citiesSelected": "{count} thành phố đã chọn",
  "adv.drillDownNote": "Xem chi tiết theo quận / thương hiệu — cần tài khoản advertiser",
  "adv.noFormats": "Chưa có định dạng quảng cáo gợi ý cho prompt này.",
  "adv.noStudies":
    "Chưa có case study nào được đăng trên Strapi. Đăng bài Case Study trên Strapi và Publish thì cột case study sẽ hiện ở đây.",
  "result.viewStudy": "Xem case study đầy đủ →",
  "modal.authNotice":
    "Đăng nhập bằng email/mật khẩu cho tài khoản advertiser chưa được backend hỗ trợ. Tính năng này sẽ mở khi backend auth sẵn sàng.",
  "modal.authTabs": "Đăng nhập hoặc đăng ký",
  "modal.contactCta": "Liên hệ để triển khai →",
  "modal.previewAria": "Xem trước {name}",
  "locations.loadFailed": "Không tải được dữ liệu mạng lưới",
  "locations.loading": "Đang tải dữ liệu mạng lưới",
  "locations.noIndustry":
    "Chưa có dữ liệu theo ngành từ backend. Thêm số liệu theo ngành vào SQLite thì biểu đồ sẽ hiện ở đây.",
  "locations.noCities":
    "Chưa có số liệu tháng theo thành phố từ backend. Thêm số liệu vào SQLite thì biểu đồ sẽ hiện ở đây.",
  "locations.noDirectory":
    "Chưa có thư mục địa điểm từ backend. Thêm chuỗi/địa điểm vào SQLite thì danh sách sẽ hiện ở đây.",
  "api.noBackendConfig": "Chưa cấu hình địa chỉ backend (NEXT_PUBLIC_API_BASE_URL).",
  "api.backendUnreachable": "Không kết nối được tới backend. Kiểm tra backend có đang chạy không.",
  "api.backendError": "Backend trả lỗi {status}.",
  "api.statsFailed": "Không tải được số liệu.",
  "api.realtimeUnreadable": "Backend đẩy dữ liệu realtime không đọc được.",
  "api.strapiUnreachable": "Không kết nối được tới Strapi CMS. Kiểm tra Strapi có đang chạy không.",
  "api.strapiError": "Strapi trả lỗi {status}.",
} as const;

export type DictKey = keyof typeof vi;

// Bản tiếng Anh phải có đủ mọi khóa của bản Việt — thiếu khóa nào thì
// TypeScript báo lỗi biên dịch ngay ở đây.
const en: Record<DictKey, string> = {
  "nav.main": "Main navigation",
  "nav.noDestination": "No destination yet — coming later",
  "nav.partners": "Partners",
  "nav.trusted": "Contact us",
  "nav.switchLanguage": "Switch interface language",
  "auth.signInGoogle": "Sign in with Google",
  "auth.signOut": "Sign out",
  "auth.googleUnavailable":
    "Google sign-in is handled by the backend — it isn't configured yet, so it's unavailable for now.",
  "hero.titleA": "The location-based marketing channel — reach users",
  "hero.titleB": "right where they are",
  "hero.subtitleA":
    "Describe your campaign in plain words, get location and ad format suggestions, then",
  "hero.subtitleB": "run and measure in real time",
  "hero.example": "Example: a premium coffee campaign in Ho Chi Minh City and Ha Noi.",
  "hero.promptLabel": "Enter a campaign idea",
  "hero.promptPlaceholder": "Describe your campaign idea…",
  "stats.connections": "Active connected users",
  "stats.provinces": "Full national coverage",
  "stats.chains": "Chain store networks",
  "stats.venues": "Active access points",
  "stats.emptyTitle": "No network stats yet",
  "stats.noBackend":
    "Couldn't reach the backend — set NEXT_PUBLIC_API_BASE_URL and run the FastAPI backend + SQLite.",
  "stats.emptyDb":
    "The database has no stats yet. Add records to SQLite and the numbers will appear here.",
  "stats.errorTitle": "Couldn't load network stats",
  "stats.realtimeNote": "Stats update in real time from the backend (max 1 minute delay).",
  "common.retry": "Retry",
  "common.loading": "Loading…",
  "common.sendFailed": "Couldn't send. Please try again later.",
  "common.close": "Close",
  "common.sending": "Sending…",
  "a11y.networkStats": "Network stats",
  "a11y.selectedCities": "Selected cities",
  "a11y.suggestedFormats": "Suggested ad formats",
  "coverage.description":
    "Coverage by province and venue type, served live from the database via the API — change the data in SQLite and the map follows.",
  "coverage.emptyTitle": "No coverage data yet",
  "coverage.emptyBody":
    "Add provinces and venue-type counts to SQLite and the heatmap will appear here.",
  "coverage.loadFailed": "Couldn't load coverage data",
  "how.title1": "Describe the campaign",
  "how.desc1": "Describe the campaign in plain words — no brief or spreadsheet needed.",
  "how.title2": "Get suggestions",
  "how.desc2": "Get location, venue and ad format suggestions based on coverage data.",
  "how.title3": "Run & measure",
  "how.desc3": "Run the campaign and measure engagement, reach and conversions in real time.",
  "lead.title": "Leave your details — we'll get back to you",
  "lead.subtitle": "For advertisers, Wi-Fi owners and partners who want to work with us.",
  "lead.sentTitle": "Got your details — thank you.",
  "lead.sentBody": "We'll be in touch soon. Thank you for your interest in AWING.",
  "form.name": "Full name *",
  "form.phone": "Phone number *",
  "form.message": "Message *",
  "form.send": "Send",
  "form.sendLead": "Send details",
  "footer.about":
    "Mobile location-based marketing in Vietnam — connecting brands to users via Wi-Fi at the venue.",
  "footer.quickLinks": "Quick links",
  "footer.home": "Home",
  "footer.contact": "Contact",
  "contact.hq": "Head office: ",
  "contact.branch": "Branch office: ",
  "contact.ads": "Advertising: ",
  "contact.network": "Network partnerships: ",
  "contact.support": "User support & Wi-Fi: ",
  "contactPage.title": "Contact us",
  "contactPage.subtitle":
    "Whether you're an advertiser, a Wi-Fi owner or a potential partner, we're always happy to answer your questions and explore working together.",
  "contactPage.sentTitle": "Your message has been sent.",
  "contactPage.sentBody": "We'll reply as soon as we can. Thank you for getting in touch.",
  "contactPage.typeLabel": "Request type *",
  "contactPage.typeAds": "Advertising enquiry",
  "contactPage.typeNetwork": "Network partnership",
  "contactPage.typeSupport": "User support & Wi-Fi connection",
  "contactPage.typeOther": "Other",
  "contactPage.asideTitle": "Locations & contact",
  "adv.editLabel": "Edit campaign idea",
  "adv.cancel": "Cancel",
  "adv.loadingResults": "Loading results",
  "adv.noPrompt": "No prompt to suggest from",
  "adv.noResult": "No matching results",
  "adv.noPromptHint": "Enter a campaign idea on the home page, then click Get Suggestions.",
  "adv.noResultHint":
    "The backend has no locations/formats matching this prompt in SQLite. Try another prompt, or add data to the database.",
  "adv.loadFailed": "Couldn't load suggestions",
  "adv.loadFailedFallback": "Couldn't load the suggestions.",
  "adv.totalReach": "Total Reach",
  "adv.potentialEngagements": "Potential Engagements",
  "adv.impressionsPerDay": "Est. Impressions/Day",
  "adv.citiesSelected": "{count} cities selected",
  "adv.drillDownNote": "Drill down to district / brand level — requires advertiser login",
  "adv.noFormats": "No suggested ad formats for this prompt.",
  "adv.noStudies":
    "No case studies published on Strapi yet. Publish a Case Study in Strapi and the column will appear here.",
  "result.viewStudy": "View full case study →",
  "modal.authNotice":
    "Email/password sign-in for advertiser accounts isn't supported by the backend yet. This will open once backend auth is ready.",
  "modal.authTabs": "Sign in or register",
  "modal.contactCta": "Contact us to get started →",
  "modal.previewAria": "Preview {name}",
  "locations.loadFailed": "Couldn't load network data",
  "locations.loading": "Loading network data",
  "locations.noIndustry":
    "No industry data from the backend yet. Add industry figures to SQLite and the chart will appear here.",
  "locations.noCities":
    "No monthly city figures from the backend yet. Add data to SQLite and the chart will appear here.",
  "locations.noDirectory":
    "No location directory from the backend yet. Add chains/locations to SQLite and the list will appear here.",
  "api.noBackendConfig": "Backend address isn't configured (NEXT_PUBLIC_API_BASE_URL).",
  "api.backendUnreachable": "Couldn't reach the backend. Check that it's running.",
  "api.backendError": "Backend returned error {status}.",
  "api.statsFailed": "Couldn't load the stats.",
  "api.realtimeUnreadable": "Couldn't read the realtime data pushed by the backend.",
  "api.strapiUnreachable": "Couldn't reach Strapi CMS. Check that it's running.",
  "api.strapiError": "Strapi returned error {status}.",
};

const dict: Record<Locale, Record<DictKey, string>> = { vi, en };

/** Dịch một khóa theo locale; {var} trong chuỗi được thay bằng vars. */
export function translate(
  locale: Locale,
  key: DictKey,
  vars?: Record<string, string>,
): string {
  let text = dict[locale][key] ?? dict.vi[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value);
    }
  }
  return text;
}

/** Chuẩn hóa locale đọc từ storage/URL: chỉ vi/en, còn lại về vi. */
export function parseLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const code = value.trim().toLowerCase().replace("_", "-").split("-")[0];
  return code === "en" ? "en" : "vi";
}
