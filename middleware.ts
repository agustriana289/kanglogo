// middleware.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Buat Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Dapatkan session user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Jika tidak ada session dan user mencoba mengakses halaman admin
  if (!session && req.nextUrl.pathname.startsWith("/admin")) {
    // Redirect ke halaman login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
