// components/FeaturedArticle.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  view_count: number;
}

export default function FeaturedArticle() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedArticle();
  }, []);

  const fetchFeaturedArticle = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching featured article:", error);
      } else {
        setArticle(data?.[0] || null);
      }
    } catch (error) {
      console.error("Error fetching featured article:", error);
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

  if (!article) {
    return null;
  }

  return (
    <div className="relative h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
      {article.featured_image ? (
        <Image
          src={article.featured_image}
          alt={article.title}
          fill
          className="object-cover"
        />
      ) : (
        <div className="bg-gray-200 h-full w-full flex items-center justify-center">
          <span className="text-white text-lg">No Image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-primary bg-opacity-70 flex items-end">
        <div className="p-6 text-white">
          <Link href={`/article/${article.slug}`} className="block">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 hover:text-blue-200 transition-colors">
              {article.title}
            </h2>
          </Link>
          <p className="text-sm md:text-base mb-2">{article.excerpt}</p>
          <div className="flex items-center text-xs md:text-sm">
            <span>{formatDate(article.published_at)}</span>
            {article.view_count && (
              <span className="ml-4 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {article.view_count} views
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
