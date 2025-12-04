import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isPublicRoute = req.nextUrl.pathname.startsWith("/s/");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Allow auth pages and public short link routes
  if (isAuthPage || isPublicRoute) {
    return NextResponse.next();
  }

  // Allow public API routes (for API key authentication)
  if (isApiRoute && req.nextUrl.pathname.startsWith("/api/public")) {
    return NextResponse.next();
  }

  // Redirect to signin if not logged in and trying to access protected routes
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
