import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken");

  const isAuthPage = request.nextUrl.pathname === "/";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // Si no hay token y quiere entrar a dashboard, redirect a login
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si hay token y quiere entrar a login, redirect a dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
