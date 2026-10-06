import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

// Optimistic gate for pages only: it checks that a valid session token exists.
// Pages re-check the user, role and active flag against the database (lib/auth/session.ts).
// API routes are excluded from the matcher: they authenticate themselves and return 401, and
// uploads must not be buffered by the proxy.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    const url = new URL("/login", request.nextUrl);
    if (pathname !== "/") url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|brand/).*)"],
};
