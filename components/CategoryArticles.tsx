// components/CategoryArticles.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface Article {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  author_name?: string;
}

interface CategoryArticlesProps {
  categoryName: string;
}

export default function CategoryArticles({
  categoryName,
}: CategoryArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryArticles();
  }, [categoryName]);

  const fetchCategoryArticles = async () => {
    try {
      // Menggunakan !inner untuk melakukan filtering berdasarkan kategori di server-side
      const { data, error } = await supabase
        .from("articles")
        .select(
          `
                  *,
                  article_categories!inner(
                    categories!inner(id, name, slug)
                  )
                `
        )
        .eq("status", "published")
        .ilike("article_categories.categories.name", categoryName)
        .order("published_at", { ascending: false })
        .limit(2);

      if (error) {
        console.error(`Error fetching ${categoryName} articles:`, error);
      } else {
        // Transformasi data
        const transformedArticles =
          data?.map((article: any) => ({
            ...article,
            categories: article.article_categories.map(
              (ac: any) => ac.categories
            ),
          })) || [];
        setArticles(transformedArticles);
      }
    } catch (error) {
      console.error(`Error fetching ${categoryName} articles:`, error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getArticleUrl = (article: Article) => {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/article/${year}/${month}/${article.slug}`;
  };

  const getCategoryColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "panduan":
        return "text-blue-600 border-blue-200";
      case "informasi":
        return "text-green-600 border-green-200";
      case "tutorial":
        return "text-purple-600 border-purple-200";
      default:
        return "text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h3
        className={`font-semibold mb-4 ${getCategoryColor(
          categoryName
        )} border-b pb-2`}
      >
        {categoryName}
      </h3>
      <div className="space-y-8">
        {articles.map((article) => (
          <div key={article.id} className="article">
            <Link href={getArticleUrl(article)} className="block">
              <h4 className="font-semibold text-gray-900 line-clamp-2 transition-colors mb-2">
                {article.title}
              </h4>
              <div className="flex gap-x-2 items-center text-xs">
                <span className="text-gray-500 flex gap-1">
                  <ClockIcon className="w-4 h-4" /> {formatDate(article.published_at)}
                </span>
                <span className="text-gray-500 flex gap-1">
                  <UserIcon className="w-4 h-4" /> {article.author_name}
                </span>
              </div>
            </Link>
          </div>
        ))}
        {articles.length === 0 && (
          <p className="text-gray-500 text-xs">
            Belum ada artikel di kategori ini
          </p>
        )}
      </div>
    </div>
  );
}
