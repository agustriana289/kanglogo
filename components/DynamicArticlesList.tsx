"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ArticleCard from "./ArticleCard";
import LogoPathAnimation from "./LogoPathAnimation";

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
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
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
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada artikel yang ditemukan</h3>
          <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 bg-white rounded-xl shadow-sm p-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <nav aria-label="Page navigation" className="flex justify-center mt-10">
          <ul className="flex -space-x-px text-sm">
            {/* Previous Button */}
            <li>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-s-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
            </li>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <li key={pageNum}>
                <button
                  onClick={() => setPage(pageNum)}
                  aria-current={pageNum === page ? "page" : undefined}
                  className={`flex items-center justify-center box-border border font-medium text-sm w-10 h-10 focus:outline-none transition-colors ${pageNum === page
                    ? "text-primary bg-gray-100 border-gray-200 hover:text-primary"
                    : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  {pageNum}
                </button>
              </li>
            ))}

            {/* Next Button */}
            <li>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-e-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
