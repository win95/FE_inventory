// Proxy locale (Docs §8.4, FE 4): locale theo đường dẫn /vi – /en,
// không chuyển hướng theo IP. Đường dẫn chưa có tiền tố locale được chuyển
// về /{locale} + đường dẫn, locale ưu tiên cookie awing_locale (nút EN/VI
// ghi), mặc định vi. Đường dẫn đã có /vi hoặc /en đi thẳng.
// Đổi từ middleware.ts sang proxy.ts (P0 K8s FE + cache): Next 16 đổi tên
// và proxy chạy Node.js runtime theo mặc định — middleware (Edge Runtime)
// biên dịch cả cache handler vào bundle edge, và @publira import
// node:timers/promises làm mọi request qua middleware 500
// ("Native module not found"). Proxy Node.js không gặp lỗi này.
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE_KEY, parseLocale } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/").filter(Boolean)[0];
  if (first === "vi" || first === "en") return NextResponse.next();
  const locale = parseLocale(request.cookies.get(LOCALE_COOKIE_KEY)?.value);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // opengraph-image/twitter-image là file metadata ở gốc — không chuyển
    // hướng locale, nếu không URL ảnh OG bị 307 về /vi/opengraph-image (404).
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|twitter-image|_not-found|.*\\..*).*)",
  ],
};
