import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('robots_txt')
            .single();

        const defaultRobots = `User-agent: *
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

        if (error) {
            console.error('Error fetching robots.txt:', error);
            return new NextResponse(defaultRobots, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }

        return new NextResponse(data?.robots_txt || defaultRobots, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    } catch (error) {
        console.error('Error:', error);
        const defaultRobots = `User-agent: *
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

        return new NextResponse(defaultRobots, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }
}
