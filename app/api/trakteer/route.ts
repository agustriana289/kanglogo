import { NextResponse } from 'next/server';

export async function GET() {
    const TRAKTEER_API_KEY = "trapi-3jHWQ6QxgxgZIOhBVlwNzPw9";
    const API_URL = "https://api.trakteer.id/v1/supports?limit=5&sort=created_at:desc";

    try {
        const res = await fetch(API_URL, {
            headers: {
                'Accept': 'application/json',
                'key': TRAKTEER_API_KEY,
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!res.ok) {
            // Fallback for demo if API fails or key is invalid for this endpoint type
            console.error("Trakteer API Error:", res.status, res.statusText);
            return NextResponse.json({ success: false, data: [] });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data.result || [] });

    } catch (error) {
        console.error("Trakteer Fetch Error:", error);
        return NextResponse.json({ success: false, data: [] });
    }
}
