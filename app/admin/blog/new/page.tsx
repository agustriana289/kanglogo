// app/admin/blog/new/page.tsx
import { Suspense } from "react";
import ArticleEditor from "@/components/ArticleEditor";

export default function NewArticlePage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Tulis Artikel Baru
        </h1>
        <Suspense fallback={<div>Loading...</div>}>
          <ArticleEditor />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Tulis Artikel Baru - Admin",
};
