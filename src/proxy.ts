// Next 16 calls this Proxy; it is the old middleware file under a new name.
//
// Deliberately dumb: it only asks whether a session cookie is present, so a
// signed-out browser lands on /login instead of on a flash of empty tables.
// Whether that cookie is genuine is decided by requireUser(), which can read
// the database — the guard that actually matters is src/app/(app)/layout.tsx.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "bizbook_session";

export function proxy(request: NextRequest) {
  const hasCookie = request.cookies.has(SESSION_COOKIE);
  const onLogin = request.nextUrl.pathname === "/login";

  // Only ever redirects *towards* /login. Bouncing a cookie-holder away from it
  // looked tidy and was a trap: a cookie the database no longer recognises — a
  // reset Supabase project, a changed AUTH_SECRET — makes requireUser() send the
  // browser to /login and this line sent it straight back, forever, with no way
  // to reach the page that would issue a good cookie.
  if (!hasCookie && !onLogin) return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own assets and the files dropped in /public
  // (company logos are fetched by the headless browser that prints PDFs).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)"],
};
