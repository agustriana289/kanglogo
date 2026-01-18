// components/FeaturedArticle.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { ClockIcon } from "@heroicons/react/24/outline";

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  content?: string;
  published_at: string;
  view_count: number;
}

export default function FeaturedArticle() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [heroBackground, setHeroBackground] = useState<string>("");

  useEffect(() => {
    fetchFeaturedArticle();
    fetchHeroBackground();
  }, []);

  // Fungsi untuk mengekstrak gambar pertama dari HTML content
  const extractFirstImage = (htmlContent: string): string | null => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    const match = htmlContent.match(imgRegex);
    return match ? match[1] : null;
  };

  const fetchHeroBackground = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_content")
        .select("value")
        .eq("section", "hero")
        .eq("key_name", "hero_background")
        .single();

      if (error) {
        console.error("Error fetching hero background:", error);
      } else if (data?.value) {
        setHeroBackground(data.value);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchFeaturedArticle = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, featured_image, content, published_at, view_count")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching featured article:", error);
      } else if (data?.[0]) {
        const fetchedArticle = data[0];
        setArticle(fetchedArticle);

        // Prioritaskan featured_image, jika tidak ada ambil dari content
        if (fetchedArticle.featured_image) {
          setImageUrl(fetchedArticle.featured_image);
        } else if (fetchedArticle.content) {
          const extractedImage = extractFirstImage(fetchedArticle.content);
          if (extractedImage) {
            setImageUrl(extractedImage);
          }
        }
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

  const getArticleUrl = (article: Article) => {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `/article/${year}/${month}/${article.slug}`;
  };

  if (!article) {
    return null;
  }

  return (
    <div className="relative h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
      <div
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: heroBackground
            ? `url(${heroBackground})`
            : "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        }}
      />

      <div className="absolute inset-0 bg-primary/50 flex items-end z-10">
        <div className="p-6 text-white drop-shadow-lg">
          <Link href={getArticleUrl(article)} className="block">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 hover:text-blue-200 transition-colors">
              {article.title}
            </h2>
          </Link>
          <p className="text-sm md:text-base mb-2">{article.excerpt}</p>
          <div className="flex items-center text-xs">
            <span className="flex gap-1"><ClockIcon className="w-4 h-4 mr-1" /> <span>{formatDate(article.published_at)}</span></span>
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
