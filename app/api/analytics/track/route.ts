import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { page_path, referrer, device_type, country, event_type } = body;

        // Validate required fields
        if (!page_path) {
            return NextResponse.json(
                { error: 'Missing page_path' },
                { status: 400 }
            );
        }

        // Insert into Supabase
        const { error } = await supabase
            .from('analytics_visits')
            .insert({
                page_path,
                referrer: referrer || null,
                device_type: device_type || 'Desktop',
                country: country || 'Unknown',
                event_type: event_type || 'pageview',
            });

        if (error) {
            console.error('Error inserting analytics:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('SERVER ERROR inserting analytics:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
