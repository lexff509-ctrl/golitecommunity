import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "golite_session";

const protectedRoutes = ["/dashboard", "/admin"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Check if path matches protected routes
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If accessing protected route without token → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth routes WITH token → redirect to dashboard
  if (isAuthRoute && token) {
    const dashUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
