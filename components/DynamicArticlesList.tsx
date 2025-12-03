"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ArticleCard from "./ArticleCard";
import LogoLoading from "./LogoLoading";

// --- PERUBAHAN 1: PERBAIKI INTERFACE Article ---
// Interface ini disesuaikan dengan yang diharapkan oleh komponen ArticleCard
interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  author_name: string; // Diubah menjadi string langsung
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface DynamicArticlesListProps {
  initialCategory?: string;
}

export default function DynamicArticlesList({
  initialCategory,
}: DynamicArticlesListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<
    { id: number; name: string; slug: string }[]
  >([]);
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
        .from("categories")
        .select("id, name, slug")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("articles")
        .select(
          `
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
        `,
          { count: "exact" }
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range((page - 1) * articlesPerPage, page * articlesPerPage - 1);

      // Filter by category if selected
      if (selectedCategory) {
        query = query.contains("article_categories.categories.slug", [
          selectedCategory,
        ]);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching articles:", error);
      } else {
        // --- PERUBAHAN 2: PERBAIKI LOGIKA TRANSFORMASI DATA ---
        // Kita tidak perlu lagi membuat object `author`, cukup gunakan `author_name` langsung
        // dan ratakan array kategori
        const transformedData =
          data?.map((article) => ({
            ...article,
            // Properti author_name sudah ada dari hasil query, jadi tidak perlu diubah
            categories: article.article_categories.flatMap(
              (ac) => ac.categories
            ),
          })) || [];

        setArticles(transformedData);
        setTotalPages(Math.ceil((count || 0) / articlesPerPage));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <LogoLoading size="xl" />
          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
            Dapatkan inspirasi dan wawasan baru di artikel terbaru kami.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Articles Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-blue-600 border-blue-200 border-b pb-2">
            New Updates
          </h3>

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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    pageNum === page
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}
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
