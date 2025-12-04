// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Dapatkan token dari cookies
  const token = req.cookies.get("sb-access-token")?.value;

  // Jika tidak ada token dan user mencoba mengakses halaman admin
  if (!token && req.nextUrl.pathname.startsWith("/admin")) {
    // Redirect ke halaman login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
