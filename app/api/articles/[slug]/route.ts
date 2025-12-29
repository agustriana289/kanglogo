import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const { data: article, error } = await supabase
            .from('articles')
            .select('id, title, slug, author, content, created_at')
            .eq('slug', slug)
            .single();

        if (error || !article) {
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            title: article.title,
            author: article.author || 'KangLogo Team',
            slug: article.slug,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch article' },
            { status: 500 }
        );
    }
}
