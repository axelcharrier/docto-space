import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Optimistic, edge-level guard: keeps unauthenticated users out of
// /doctor and /astronaut before any rendering happens, and sends them to
// /login instead. This is only ever a fast, cookie-based check.
//
// It deliberately does NOT enforce the role itself: a signed-in user
// hitting a section they have no access to must get a real 403, and that
// can only be guaranteed by a check that runs in the render path (see
// requireRole() in lib/dal.ts, used by the doctor/astronaut layouts).
const PROTECTED_PREFIXES = ["/doctor", "/astronaut"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/doctor/:path*", "/astronaut/:path*"],
};
