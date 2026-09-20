import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/tentang", "/register", "/admin/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("eco_token")?.value;
  const role = req.cookies.get("eco_role")?.value;

  // Authenticated user hits any login page → redirect to their dashboard
  const isLoginPage = pathname === "/login" || pathname === "/admin/login";
  if (isLoginPage && token) {
    const dest = role === "admin" ? "/admin/verification" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Allow other public routes
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes require admin role
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
