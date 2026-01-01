"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
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

  // Fungsi untuk memperbaiki format konten sebelum ditampilkan
  const processContent = useCallback((content: string) => {
    let processedContent = content.replace(
      /<p>(\d+\.\s+[\s\S]*?)<\/p>/g,
      "<h2>$1</h2>"
    );

    processedContent = processedContent.replace(
      /<p>\s*→\s*([\s\S]*?)<\/p>/g,
      "<li>$1</li>"
    );

    processedContent = processedContent.replace(
      /<p>\s*✓\s*([\s\S]*?)<\/p>/g,
      "<li>$1</li>"
    );

    processedContent = processedContent.replace(/(<br\s*\/?>){2,}/gi, "<br>");
    processedContent = processedContent.replace(/<ul><ul>/g, "<ul>");
    processedContent = processedContent.replace(/<\/ul><\/ul>/g, "</ul>");
    processedContent = processedContent.replace(/<li><\/li>/g, "");

    const liWithoutUl = processedContent.match(/<li>(.*?)<\/li>/g);
    if (liWithoutUl) {
      liWithoutUl.forEach((item) => {
        if (!processedContent.includes(`<ul>${item}</ul>`)) {
          processedContent = processedContent.replace(item, `<ul>${item}</ul>`);
        }
      });
    }

    return processedContent;
  }, []);

  const fetchRelatedArticles = useCallback(async () => {
    try {
      const categoryIds = article.categories.map((c) => c.id);

      if (categoryIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: relatedArticleCategories, error: categoryError } =
        await supabase
          .from("article_categories")
          .select("article_id")
          .in("category_id", categoryIds)
          .neq("article_id", article.id);

      if (categoryError) {
        console.error("Error fetching related categories:", categoryError);
        setLoading(false);
        return;
      }

      const relatedArticleIds = [
        ...new Set(relatedArticleCategories?.map((ac) => ac.article_id) || []),
      ];

      if (relatedArticleIds.length === 0) {
        setLoading(false);
        return;
      }

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
        .limit(4);

      if (error) {
        console.error("Error fetching related articles:", error);
      } else if (Array.isArray(data) && data.length > 0) {
        const transformedData = data.map((item: any) => ({
          ...item,
          author: item.users || { name: "Admin" },
          categories: Array.isArray(item.article_categories)
            ? item.article_categories
              .map((ac: any) => ac.categories)
              .filter(Boolean)
            : [],
        }));
        setRelatedArticles(transformedData);
      }
    } catch (error) {
      console.error("Error in fetchRelatedArticles:", error);
    } finally {
      setLoading(false);
    }
  }, [article.id, article.categories]);

  useEffect(() => {
    fetchRelatedArticles();
  }, [fetchRelatedArticles]);

  const fetchLatestArticles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, published_at")
        .eq("status", "published")
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(2);

      if (error) {
        console.error("Error fetching latest articles:", error);
      } else if (data) {
        setLatestArticles(data);
      }
    } catch (error) {
      console.error("Error fetching latest articles:", error);
    }
  }, [article.id]);

  useEffect(() => {
    fetchLatestArticles();
  }, [fetchLatestArticles]);

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
                <ol className="flex flex-wrap items-center space-x-2 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="text-gray-600 hover:text-primary transition-colors"
                    >
                      Home
                    </Link>
                  </li>

                  {article.categories.length > 0 &&
                    article.categories.map((category, index) => (
                      <React.Fragment key={category.id}>
                        <li className="text-gray-400">/</li>
                        <li>
                          <Link
                            href={`/category/${category.slug}`}
                            className="text-gray-600 hover:text-primary transition-colors"
                          >
                            {category.name}
                          </Link>
                        </li>
                      </React.Fragment>
                    ))}
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

            <div className="px-6 pb-6">
              <div
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{
                  __html: processContent(article.content),
                }}
              />

              {/* Baca Artikel Lainnya (2 Artikel Terbaru) - Versi Simple Link */}
              {latestArticles.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Baca Artikel Lainnya</h3>
                  <ul className="space-y-2 list-none">
                    {latestArticles.map((latest) => (
                      <li key={latest.id}>
                        <Link
                          href={getArticleUrl(latest)}
                          className="text-base text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {latest.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

          {relatedArticles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Artikel Terkait
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <div
                    key={relatedArticle.id}
                    className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {relatedArticle.featured_image && (
                      <div className="overflow-hidden">
                        <img
                          src={relatedArticle.featured_image}
                          alt={relatedArticle.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {relatedArticle.categories.length > 0 && (
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {relatedArticle.categories[0].name}
                          </span>
                        </div>
                      )}
                      <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                        <a
                          href={getArticleUrl(relatedArticle)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {relatedArticle.title}
                        </a>
                      </h4>
                      <p className="text-gray-500 text-xs">
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
          <Sidebar showPopularArticles={true} showCategories={true} />
        </div>
      </div>

      {/* Subscription Form */}
      <div className="mt-12">
        <SubscriptionForm />
      </div>
    </div>
  );
}
