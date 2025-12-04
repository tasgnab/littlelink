import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public access to:
  // 1. Auth pages (/auth/*)
  // 2. API auth routes (/api/auth/*)
  // 3. Short URL redirects (/:shortCode)
  // 4. Static files and Next.js internals
  const isAuthPage = pathname.startsWith("/auth");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/);

  // Check if it's a short code (single path segment, not dashboard or auth)
  const isShortCode =
    pathname.split("/").filter(Boolean).length === 1 &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/auth") &&
    pathname !== "/";

  if (isAuthPage || isAuthApi || isStaticFile || isShortCode) {
    return NextResponse.next();
  }

  // Check authentication for all other routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If not authenticated, redirect to sign-in page
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
