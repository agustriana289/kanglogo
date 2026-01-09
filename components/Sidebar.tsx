"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface Widget {
  id: number;
  title: string;
  content: string;
}

interface PopularArticle {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  views: number;
}

interface SidebarProps {
  showPopularArticles?: boolean;
  showCategories?: boolean;
}

export default function Sidebar({ showPopularArticles = false, showCategories = false }: SidebarProps) {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const isBlogPage = !pathname.startsWith("/pages");

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      if (isBlogPage && showCategories) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
        } else {
          const categoriesWithCounts = await Promise.all(
            categoriesData.map(async (category) => {
              const { count, error } = await supabase
                .from("article_categories")
                .select("*", { count: "exact", head: true })
                .eq("category_id", category.id);

              return {
                ...category,
                count: count || 0,
              };
            })
          );
          setCategories(categoriesWithCounts.filter(cat => cat.count > 0));
        }
      }

      if (isBlogPage && showPopularArticles) {
        const { data: popularData, error: popularError } = await supabase
          .from("articles")
          .select("id, title, slug, published_at, views")
          .eq("status", "published")
          .order("views", { ascending: false })
          .limit(5);

        if (popularError) {
          console.error("Error fetching popular articles:", popularError);
        } else {
          setPopularArticles(popularData || []);
        }
      }

      const { data: widgetsData, error: widgetsError } = await supabase
        .from("widgets")
        .select("*")
        .eq("position", "sidebar")
        .order("created_at", { ascending: true });

      if (widgetsError) {
        console.error("Error fetching widgets:", widgetsError);
      } else {
        setWidgets(widgetsData || []);
      }
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getArticleUrl = (article: PopularArticle) => {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/article/${year}/${month}/${article.slug}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy", { locale: id });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-200 animate-pulse rounded-lg p-4"></div>
        <div className="h-40 bg-gray-200 animate-pulse rounded-lg p-4"></div>
      </div>
    );
  }

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);
  const hasMoreCategories = categories.length > 10;

  return (
    <div className="space-y-6">
      {isBlogPage && showPopularArticles && popularArticles.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-slate-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Artikel Populer
          </h3>
          <div className="space-y-3">
            {popularArticles.map((article) => (
              <Link
                key={article.id}
                href={getArticleUrl(article)}
                className="block group"
              >
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-blue-400 line-clamp-2 mb-1">
                  {article.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(article.published_at)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isBlogPage && showCategories && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-slate-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Kategori
          </h3>
          <div className="space-y-2">
            {displayedCategories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-blue-400">
                  {category.name}
                </span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </Link>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-500 text-sm">
                Belum ada kategori
              </p>
            )}
            {hasMoreCategories && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-2 text-sm text-primary dark:text-blue-400 hover:text-primary-dark dark:hover:text-blue-300 font-medium"
              >
                {showAllCategories ? "Tampilkan Lebih Sedikit" : "Muat Lainnya"}
              </button>
            )}
          </div>
        </div>
      )}

      {widgets.map((widget) => (
        <div
          key={widget.id}
          className="bg-white rounded-lg shadow p-4"
        >
          <div
            className="text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: widget.content }}
          />
        </div>
      ))}
    </div>
  );
}
