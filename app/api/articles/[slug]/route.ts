import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        console.log('Fetching article with slug:', slug);

        const { data: article, error } = await supabase
            .from('articles')
            .select('id, title, slug, author_name, content, created_at')
            .eq('slug', slug)
            .single();

        console.log('Article data:', article);
        console.log('Error:', error);

        if (error || !article) {
            console.error('Article not found:', error);
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            title: article.title,
            author: article.author_name || 'KangLogo Team',
            slug: article.slug,
        });
    } catch (error) {
        console.error('Error in GET /api/articles/[slug]:', error);
        return NextResponse.json(
            { error: 'Failed to fetch article' },
            { status: 500 }
        );
    }
}
