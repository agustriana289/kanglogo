"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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

export default function DynamicLatestArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
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
          author_name,
          article_categories(
            categories(id, name, slug)
          )
        `
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching articles:", error);
      } else {
        // Transform data to match our interface
        const transformedData =
          data?.map((article) => ({
            ...article,
            // Pertahankan author_name sebagai string, jangan ubah menjadi objek
            // Gunakan flatMap untuk "meratakan" array kategori yang bersarang
            categories: article.article_categories.flatMap(
              (ac) => ac.categories
            ),
          })) || [];

        setArticles(transformedData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Buat URL artikel berdasarkan format yang diinginkan
  const getArticleUrl = (article: Article) => {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/article/${year}/${month}/${article.slug}`;
  };

  return (
    <div className="section" id="Content" data-name="blog">
      <div className="widget Blog" data-version="2" id="Blog-1">
        <div className="my-12 max-w-6xl mx-auto">
          {/* Header */}
          <div
            className="faqsSection px-4 sm:px-6 lg:px-8 section"
            id="faqsSection"
            data-name="Faqs Section"
          >
            <h1 className="text-center max-w-2xl mx-auto font-manrope font-bold text-3xl text-slate-700 sm:mb-5 md:text-5xl leading-[50px]">
              <span className="text-primary">Artikel</span> Terbaru
            </h1>
            <p className="max-w-2xl mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
              Dapatkan inspirasi dan wawasan baru di artikel terbaru kami.
            </p>
          </div>
        </div>

        {/* Grid Artikel */}
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto py-8">
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {articles.map((article) => (
                <article key={article.id} className="flex flex-col items-start">
                  {article.categories.length > 0 && (
                    <Link
                      className="inline-block rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                      href={`/category/${article.categories[0].slug}`}
                    >
                      {article.categories[0].name}
                    </Link>
                  )}
                  <div className="mt-5 flex items-center gap-x-2 text-sm text-slate-700">
                    <time dateTime={article.published_at}>
                      {formatDate(article.published_at)}
                    </time>
                    <span aria-hidden="true">•</span>
                    <p>ditulis oleh {article.author_name}</p>
                  </div>
                  <div className="group relative mt-3">
                    <h3 className="text-lg font-semibold leading-6 text-slate-900 group-hover:text-slate-700">
                      <Link href={getArticleUrl(article)}>
                        <span className="absolute inset-0"></span>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="mt-5 line-clamp-2 text-sm font-normal leading-7 text-slate-700">
                      {article.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-8 mb-16">
            <div className="flex justify-center gap-2" id="blog-pager">
              <Link
                className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-white rounded-full bg-primary shadow-sm hover:bg-primary/80 transition-all duration-500"
                href="/articles"
              >
                Semua artikel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
