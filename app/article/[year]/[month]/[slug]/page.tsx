import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ArticleContent from '@/components/ArticleContent';

interface PageProps {
  params: {
    year: string;
    month: string;
    slug: string;
  };
}

// Revalidate setiap 60 detik (ISR - Incremental Static Regeneration)
// Ini akan membuat Next.js me-refresh halaman setiap 60 detik
export const revalidate = 60;

async function getArticle(params: PageProps['params']) {
  const { year, month, slug } = params;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        article_categories(
          categories(id, name, slug)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Check if the year and month match
    const articleDate = new Date(data.published_at);
    const articleYear = articleDate.getFullYear().toString();
    const articleMonth = String(articleDate.getMonth() + 1).padStart(2, '0');

    // We'll skip the year/month check for now to avoid 404s
    // if (articleYear !== year || articleMonth !== month) {
    //   return null;
    // }

    return data;
  } catch (error) {
    console.error('Error in getArticle:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params);

  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan',
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.featured_image ? [article.featured_image] : [],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params);

  if (!article) {
    notFound();
  }

  // Transform data
  const transformedArticle = {
    ...article,
    author: { name: article.author_name },
    categories: article.article_categories.map((ac: any) => ac.categories)
  };

  return <ArticleContent article={transformedArticle} />;
}