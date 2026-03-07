// app/articles/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import DynamicArticlesList from "@/components/DynamicArticlesList";
import FeaturedArticle from "@/components/FeaturedArticle";
import CategoryArticles from "@/components/CategoryArticles";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Artikel & Blog - KangLogo.com",
  description: "Jelajahi artikel seputar desain logo, branding, tips kreatif, dan panduan lengkap untuk bisnis Anda",
  keywords: "artikel desain logo, blog branding, tips desain, panduan logo, KangLogo",
  alternates: {
    canonical: "https://kanglogo.com/articles",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Artikel & Blog - KangLogo.com",
    description: "Jelajahi artikel seputar desain logo, branding, tips kreatif, dan panduan lengkap untuk bisnis Anda",
    url: "https://kanglogo.com/articles",
    siteName: "KangLogo.com",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artikel & Blog - KangLogo.com",
    description: "Jelajahi artikel seputar desain logo, branding, tips kreatif, dan panduan lengkap untuk bisnis Anda",
    creator: "@kanglogo",
    site: "@kanglogo",
  },
};

export default function ArticlesPage() {
  return (
    <main className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            <span className="text-primary">Artikel</span> & Blog
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Jelajahi artikel seputar desain logo, branding, dan tips kreatif
          </p>
        </div>

        {/* Featured Article Banner */}
        <Suspense
          fallback={<div className="h-64 bg-gray-200 animate-pulse rounded-xl"></div>}
        >
          <FeaturedArticle />
        </Suspense>

        {/* Category Articles */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Suspense
            fallback={<div className="h-40 bg-gray-200 animate-pulse rounded-xl"></div>}
          >
            <CategoryArticles categoryName="Panduan" />
          </Suspense>
          <Suspense
            fallback={<div className="h-40 bg-gray-200 animate-pulse rounded-xl"></div>}
          >
            <CategoryArticles categoryName="Informasi" />
          </Suspense>
          <Suspense
            fallback={<div className="h-40 bg-gray-200 animate-pulse rounded-xl"></div>}
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
              fallback={<div className="h-40 bg-gray-200 animate-pulse rounded-xl"></div>}
            >
              <Sidebar />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

