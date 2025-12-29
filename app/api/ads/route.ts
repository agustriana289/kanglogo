import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('ads_txt')
            .single();

        if (error) {
            console.error('Error fetching ads.txt:', error);
            return new NextResponse('# Google AdSense\n# Tambahkan kode ads.txt dari Google AdSense di sini', {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }

        return new NextResponse(data?.ads_txt || '# Google AdSense', {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return new NextResponse('# Google AdSense', {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }
}
