"use client";

import { notFound } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import LogoLoading from "@/components/LogoLoading";

import ArticleEditor from "@/components/ArticleEditor";

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
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LogoLoading size="lg" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Sedang memuat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Edit Artikel
        </h1>
        <Suspense fallback={<div>Loading...</div>}>
          <ArticleEditor article={article} />
        </Suspense>
      </div>
    </div>
  );
}
