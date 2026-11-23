// Middleware locale (Docs §8.4, FE 4): locale theo đường dẫn /vi – /en,
// không chuyển hướng theo IP. Đường dẫn chưa có tiền tố locale được chuyển
// về /{locale} + đường dẫn, locale ưu tiên cookie awing_locale (nút EN/VI
// ghi), mặc định vi. Đường dẫn đã có /vi hoặc /en đi thẳng.
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE_KEY, parseLocale } from "@/lib/i18n";

export function middleware(request: NextRequest) {
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
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|_not-found|.*\\..*).*)",
  ],
};
