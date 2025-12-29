import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('robots_txt')
            .single();

        if (error) {
            console.error('Error fetching robots.txt:', error);
            return new NextResponse(
                `User-agent: *
Allow: /

Sitemap: https://kanglogo.com/sitemap.xml`,
                {
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                }
            );
        }

        return new NextResponse(data?.robots_txt || 'User-agent: *\nAllow: /', {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return new NextResponse('User-agent: *\nAllow: /', {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }
}
