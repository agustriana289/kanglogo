// app/articles/page.tsx
import { Suspense } from "react";
import DynamicArticlesList from "@/components/DynamicArticlesList";
import FeaturedArticle from "@/components/FeaturedArticle";
import CategoryArticles from "@/components/CategoryArticles";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Featured Article Banner */}
        <Suspense
          fallback={<div className="h-64 bg-gray-200 animate-pulse"></div>}
        >
          <FeaturedArticle />
        </Suspense>

        {/* Category Articles */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Suspense
            fallback={<div className="h-40 bg-gray-200 animate-pulse"></div>}
          >
            <CategoryArticles categoryName="Panduan" />
          </Suspense>
          <Suspense
            fallback={<div className="h-40 bg-gray-200 animate-pulse"></div>}
          >
            <CategoryArticles categoryName="Informasi" />
          </Suspense>
          <Suspense
            fallback={<div className="h-40 bg-gray-200 animate-pulse"></div>}
          >
            <CategoryArticles categoryName="Tutorial" />
          </Suspense>
        </div>

        {/* Main Content and Sidebar */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - All Articles List */}
          <div className="lg:col-span-2">
            <Suspense fallback={<div>Loading...</div>}>
              <DynamicArticlesList />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Suspense
              fallback={<div className="h-40 bg-gray-200 animate-pulse"></div>}
            >
              <Sidebar />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Semua Artikel - Kanglogo",
  description: "Jelajahi semua artikel kami tentang desain logo dan branding.",
};
