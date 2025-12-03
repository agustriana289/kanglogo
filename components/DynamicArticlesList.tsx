// components/DynamicArticlesList.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ArticleCard from './ArticleCard';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  author_name: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface DynamicArticlesListProps {
  initialCategory?: string;
}

export default function DynamicArticlesList({ initialCategory }: DynamicArticlesListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<{ id: number, name: string, slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const articlesPerPage = 6;

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
    fetchCategories();
  }, [initialCategory]);

  useEffect(() => {
    fetchArticles();
  }, [page, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          author_name,
          article_categories(
            categories(id, name, slug)
          )
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range((page - 1) * articlesPerPage, page * articlesPerPage - 1);

      // Filter by category if selected
      if (selectedCategory) {
        query = query.contains('article_categories.categories.slug', [selectedCategory]);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
      } else {
        // Transform data
        const transformedData = data?.map(article => ({
          ...article,
          author: { name: article.author_name },
          categories: article.article_categories.map(ac => ac.categories)
        })) || [];

        setArticles(transformedData);
        setTotalPages(Math.ceil((count || 0) / articlesPerPage));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Articles Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 class="text-xl font-semibold mb-4 text-blue-600 border-blue-200 border-b pb-2">New Updates</h3>

          <div className="grid grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${pageNum === page
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}