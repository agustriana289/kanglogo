// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Handle parameter URL yang tidak diperlukan (seperti ?m=1)
  // Redirect ke URL bersih untuk menghindari duplicate content
  const unnecessaryParams = ['m'];
  let hasUnnecessaryParams = false;

  unnecessaryParams.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasUnnecessaryParams = true;
    }
  });

  // Jika ada parameter yang dihapus, redirect ke URL bersih
  if (hasUnnecessaryParams) {
    return NextResponse.redirect(url, 301);
  }

  // TEMPORARY: Disabled - Supabase uses localStorage not cookies
  /*
  const supabaseCookies = req.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"));

  if (
    supabaseCookies.length === 0 &&
    req.nextUrl.pathname.startsWith("/admin")
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/projects/:path*",
    "/articles/:path*",
    "/article/:path*",
    "/store/:path*",
    "/services/:path*",
  ],
};
