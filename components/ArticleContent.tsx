"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import CommentSection from "./CommentSection";
import ShareButtons from "./ShareButtons";
import SubscriptionForm from "./SubscriptionForm";
import Sidebar from "./Sidebar";
import React from "react";
import LogoPathAnimation from "./LogoPathAnimation";
import WidgetArea from "./WidgetArea";
import Link from "next/link";

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface ArticleContentProps {
  article: Article;
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  // Add loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Effect to increment view count
  const viewIncremented = useRef(false);
  useEffect(() => {
    const incrementView = async () => {
      // Prevent double counting in Strict Mode or re-renders
      if (viewIncremented.current) return;
      viewIncremented.current = true;

      try {
        await supabase.rpc('increment_article_views', { article_id: article.id });
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    incrementView();
  }, [article.id]);

  useEffect(() => {
    fetchRelatedArticles();
  }, [article.id]);

  const fetchRelatedArticles = async () => {
    try {
      // Get articles from same categories
      const categoryIds = article.categories.map((c) => c.id);

      if (categoryIds.length === 0) {
        setLoading(false);
        return;
      }

      // First, get article IDs that share categories
      const { data: relatedArticleCategories, error: categoryError } =
        await supabase
          .from("article_categories")
          .select("article_id")
          .in("category_id", categoryIds)
          .neq("article_id", article.id);

      if (categoryError) {
        console.error(
          "Error fetching related article categories:",
          categoryError
        );
        setLoading(false);
        return;
      }

      // Get unique article IDs
      const relatedArticleIds = [
        ...new Set(relatedArticleCategories?.map((ac) => ac.article_id) || []),
      ];

      if (relatedArticleIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch actual articles
      const { data, error } = await supabase
        .from("articles")
        .select(
          `
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        users(name),
        article_categories(
          categories(id, name, slug)
        )
      `
        )
        .eq("status", "published")
        .in("id", relatedArticleIds)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching related articles:", error);
      } else {
        // Transform data
        const transformedData =
          data?.map((article) => ({
            ...article,
            author: article.users,
            categories: article.article_categories
              .map((ac) => ac.categories)
              .filter(Boolean),
          })) || [];

        setRelatedArticles(transformedData);
      }
    } catch (error) {
      console.error("Error fetching related articles:", error);
    } finally {
      // Set loading to false when done
      setLoading(false);
    }
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy", { locale: id });
  };

  // Buat URL artikel
  const getArticleUrl = (article: any) => {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/article/${year}/${month}/${article.slug}`;
  };

  // Fungsi untuk memperbaiki format konten sebelum ditampilkan
  const processContent = (content: string) => {
    // Ganti semua <p> yang seharusnya <h2> kembali menjadi <h2>
    // Contoh: <p>1. Pahami Karakter...</p> menjadi <h2>1. Pahami Karakter...</h2>
    // --- PERUBAHAN 1 ---
    let processedContent = content.replace(
      /<p>(\d+\.\s+[\s\S]*?)<\/p>/g,
      "<h2>$1</h2>"
    );

    // Perbaiki format list yang dipecah menjadi <p> terpisah dengan panah
    // Contoh: <p>→ Mana yang paling...</p> menjadi <li>Mana yang paling...</li>
    // --- PERUBAHAN 2 ---
    processedContent = processedContent.replace(
      /<p>\s*→\s*([\s\S]*?)<\/p>/g,
      "<li>$1</li>"
    );

    // Perbaiki list item dengan centang
    // --- PERUBAHAN 3 ---
    processedContent = processedContent.replace(
      /<p>\s*✓\s*([\s\S]*?)<\/p>/g,
      "<li>$1</li>"
    );

    // Hapus <br> yang berlebihan (lebih dari satu berturut-turut)
    processedContent = processedContent.replace(/(<br\s*\/?>){2,}/gi, "<br>");

    // Perbaiki nested ul yang salah
    processedContent = processedContent.replace(/<ul><ul>/g, "<ul>");
    processedContent = processedContent.replace(/<\/ul><\/ul>/g, "</ul>");

    // Perbaiki list item kosong
    processedContent = processedContent.replace(/<li><\/li>/g, "");

    // Pastikan list item yang berdiri sendiri dibungkus dengan <ul>
    // Ini adalah solusi sederhana yang mungkin perlu penyesuaian untuk kasus yang lebih kompleks
    const liWithoutUl = processedContent.match(/<li>(.*?)<\/li>/g);
    if (liWithoutUl) {
      liWithoutUl.forEach((item) => {
        // Cek apakah item sudah berada di dalam <ul>
        if (!processedContent.includes(`<ul>${item}</ul>`)) {
          processedContent = processedContent.replace(item, `<ul>${item}</ul>`);
        }
      });
    }

    return processedContent;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <LogoPathAnimation />
          <p className="mt-8 text-xl text-slate-600">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Konten Utama */}
        <div className="lg:col-span-2">
          {/* Main Article Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            {/* Article Header */}
            <div className="p-6 pb-4">
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center space-x-2">
                  <li>
                    <Link
                      href="/"
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-xs font-medium text-gray-700 transition-colors"
                    >
                      Home
                    </Link>
                  </li>

                  {/* Tampilkan kategori jika ada */}
                  {article.categories.length > 0 &&
                    article.categories.map((category, index) => (
                      <React.Fragment key={category.id}>
                        <li className="flex items-center">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </li>
                        <li>
                          <Link
                            href={`/category/${category.slug}`}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-xs font-medium text-gray-700 transition-colors"
                          >
                            {category.name}
                          </Link>
                        </li>
                      </React.Fragment>
                    ))}

                  {/* Item terakhir (judul artikel) */}
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </li>
                  <li>
                    <span className="px-3 py-1 bg-slate-200/50 text-slate-700 rounded-full text-xs font-medium truncate max-w-24 md:max-w-32">
                      {article.title}
                    </span>
                  </li>
                </ol>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center">
                  {article.author.avatar && (
                    <img
                      src={article.author.avatar}
                      alt={article.author.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {article.author.name}
                    </p>
                    <p>{formatDate(article.published_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {article.featured_image && (
              <div className="px-6 pb-6">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="px-6 pb-6">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: processContent(article.content),
                }}
              />
            </div>
          </div>

          <WidgetArea position="Blog_footer" />

          {/* Share Buttons Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bagikan artikel ini
            </h3>
            <ShareButtons url={currentUrl} title={article.title} />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Artikel Terkait
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <div
                    key={relatedArticle.id}
                    className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {relatedArticle.featured_image && (
                      <img
                        src={relatedArticle.featured_image}
                        alt={relatedArticle.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      {relatedArticle.categories.length > 0 && (
                        <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-white mb-3">
                          {relatedArticle.categories[0].name}
                        </span>
                      )}
                      <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                        <a
                          href={getArticleUrl(relatedArticle)}
                          className="hover:text-primary transition-colors"
                        >
                          {relatedArticle.title}
                        </a>
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {formatDate(relatedArticle.published_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section - Already in Card */}
          <CommentSection articleId={article.id} />
        </div>

        {/* <-- 3. Tambahkan Kolom Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar />
        </div>
      </div>

      {/* Subscription Form */}
      <div className="mt-12">
        <SubscriptionForm />
      </div>
    </div>
  );
}
