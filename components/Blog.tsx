// components/Blog.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ArticleCard from './ArticleCard';

interface Article {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  author_name: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
}

export default function LatestArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestArticles();
  }, []);

  const fetchLatestArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          title,
          slug,
          excerpt,
          published_at,
          author_name,
          article_categories(
            categories(id, name, slug)
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching latest articles:', error);
      } else {
        const transformedData = data?.map(article => ({
          ...article,
          categories: article.article_categories.map((ac: any) => ac.categories)
        })) || [];
        setArticles(transformedData);
      }
    } catch (error) {
      console.error('Error fetching latest articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" id="Content">
      <div className="my-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="faqsSection px-6 lg:px-8 section" id="blog">
          <h1 className="text-center max-w-2xl mx-auto font-manrope font-bold text-3xl text-slate-700 sm:mb-5 md:text-5xl leading-[50px]">
            <span className="text-primary">Artikel</span> Terbaru
          </h1>
          <p className="max-w-2xl mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
            Dapatkan inspirasi dan wawasan baru di artikel terbaru kami.
          </p>
        </div>
      </div>

      {/* Grid Artikel */}
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {articles.map((article, index) => (
                <ArticleCard key={index} article={article} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination / View All */}
        <div className="mt-8 mb-16">
          <div className="flex justify-center gap-2" id="blog-pager">
            <Link className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-white rounded-full bg-primary shadow-sm hover:bg-primary/80 transition-all duration-500" href="/articles">
              Semua artikel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}