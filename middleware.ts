// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Dapatkan semua cookies yang dimulai dengan 'sb-'
  const supabaseCookies = req.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"));

  // Jika tidak ada cookies Supabase dan user mencoba mengakses halaman admin
  if (
    supabaseCookies.length === 0 &&
    req.nextUrl.pathname.startsWith("/admin")
  ) {
    // Redirect ke halaman login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
