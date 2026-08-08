// Next 16 calls this Proxy; it is middleware under a new name. It only asks
// whether a cookie is present — whether it is genuine is decided by
// requireUser(), and the guard that matters is src/app/(app)/layout.tsx.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "bizbook_session";

export function proxy(request: NextRequest) {
  const hasCookie = request.cookies.has(SESSION_COOKIE);
  const onLogin = request.nextUrl.pathname === "/login";

  // Only ever redirects *towards* /login. Bouncing a cookie-holder away was a
  // trap: a cookie the database no longer recognises loops forever.
  if (!hasCookie && !onLogin) return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own assets and the files dropped in /public
  // (company logos are fetched by the headless browser that prints PDFs).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)"],
};
