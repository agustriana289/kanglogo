import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ArticleContent from '@/components/ArticleContent';

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
    slug: string;
  }>;
}

// Revalidate setiap 60 detik (ISR - Incremental Static Regeneration)
// Ini akan membuat Next.js me-refresh halaman setiap 60 detik
export const revalidate = 60;

async function getArticle(params: { year: string; month: string; slug: string }) {
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
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams);

  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kanglogo.com';
  const ogImage = article.featured_image || `${baseUrl}/api/og/article/${article.slug}`;

  const articleDate = new Date(article.published_at);
  const year = articleDate.getFullYear();
  const month = String(articleDate.getMonth() + 1).padStart(2, '0');
  const canonicalUrl = `${baseUrl}/article/${year}/${month}/${article.slug}`;

  const categories = article.article_categories?.map((ac: any) => ac.categories?.name).filter(Boolean) || [];
  const keywords = categories.length > 0
    ? [...categories, 'desain logo', 'jasa desain', 'KangLogo'].join(', ')
    : 'desain logo, jasa desain, KangLogo';

  return {
    title: article.title,
    description: article.excerpt,
    keywords: keywords,
    authors: [{ name: article.author_name || 'KangLogo Team' }],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonicalUrl,
      siteName: 'KangLogo.com',
      locale: 'id_ID',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at || article.published_at,
      authors: [article.author_name || 'KangLogo Team'],
      section: categories[0] || 'Blog',
      tags: categories,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [ogImage],
      creator: '@kanglogo',
      site: '@kanglogo',
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams);

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
