// components/EnhancedPageContent.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ShareButtons from "./ShareButtons";
import { Page } from "@/types/page";

interface EnhancedPageContentProps {
  page: Page;
}

export default function EnhancedPageContent({
  page,
}: EnhancedPageContentProps) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy", { locale: id });
  };

  return (
    <div>
      {/* Main Page Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        {/* Page Header */}
        <div className="p-6">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center space-x-2">
              <li>
                <a
                  href="/"
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-xs font-medium text-gray-700 transition-colors"
                >
                  Beranda
                </a>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <span className="px-3 py-1 bg-slate-200/50 text-slate-700 rounded-full text-xs font-medium truncate max-w-24 md:max-w-32">
                  {page.title}
                </span>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <p>Terakhir diperbarui pada {formatDate(page.updated_at)}</p>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-6 pb-6">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        </div>
      </div>

      {/* Share Buttons Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bagikan halaman ini
        </h3>
        <ShareButtons
          url={currentUrl}
          title={page.title}
        />
      </div>
    </div>
  );
}
