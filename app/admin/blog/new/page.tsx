// app/admin/blog/new/page.tsx
"use client";

import ArticleEditor from "@/components/ArticleEditor";
import Link from "next/link";

export default function NewArticlePage() {
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
            Buat Artikel Baru
          </h1>
          <p className="text-gray-600 mt-1">
            Tulis artikel baru untuk blog Anda
          </p>
        </div>

        <ArticleEditor />
      </div>
    </div>
  );
}
