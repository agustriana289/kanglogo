"use client";

import { notFound } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import ArticleEditor from "@/components/ArticleEditor";
import Link from "next/link";

export default function EditArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select(
            `
            *,
            article_categories(
              categories(id, name, slug)
            )
          `
          )
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("Error fetching article:", error);
          setArticle(null);
        } else {
          setArticle(data);
        }
      } catch (error) {
        console.error("Error in getArticle:", error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header with Back Link */}
        <div className="mb-6">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Artikel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Artikel
          </h1>
          <p className="text-gray-600 mt-1">
            Perbarui informasi artikel Anda
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ArticleEditor article={article} />
        </Suspense>
      </div>
    </div>
  );
}
