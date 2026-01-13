import { NextResponse } from 'next/server';

export async function GET() {
    const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login/
Disallow: /order/
Disallow: /faq/
Disallow: /generator/
Disallow: /category/
Disallow: /pages/

Sitemap: https://kanglogo.com/sitemap.xml`;

    return NextResponse.json({ content: robotsContent });
}
