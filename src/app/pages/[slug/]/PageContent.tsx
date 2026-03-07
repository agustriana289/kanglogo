"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

interface PageContentProps {
  page: {
    title: string;
    content: string | null;
    updated_at: string;
  };
}

export default function PageContent({ page }: PageContentProps) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      <div className="pt-28 pb-24 mx-auto max-w-4xl px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-10">
          <Link href="/" className="hover:text-slate-700 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 truncate">{page.title}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
          {page.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">
          <Calendar className="w-4 h-4" />
          <span>Last Updated: {new Date(page.updated_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}</span>
        </div>

        <div 
          className="page-content"
          dangerouslySetInnerHTML={{ __html: page.content || "" }} 
        />
      </div>

      <Footer />

      <style jsx global>{`
        .page-content { color: #475569; font-size: 1.0625rem; line-height: 1.9; }
        .page-content h1 { font-size: 1.875rem; font-weight: 800; color: #0f172a; margin: 2.5rem 0 1rem; line-height: 1.2; }
        .page-content h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 2.25rem 0 0.875rem; line-height: 1.3; }
        .page-content h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 1.75rem 0 0.75rem; }
        .page-content p { margin-bottom: 1.5rem; }
        .page-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .page-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .page-content li { margin-bottom: 0.5rem; }
        .page-content a { color: #4f46e5; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .page-content a:hover { color: #4338ca; }
        .page-content strong { color: #0f172a; font-weight: 700; }
        .page-content blockquote { border-left: 3px solid #6366f1; background: #f8fafc; padding: 1rem 1.5rem; border-radius: 0 1rem 1rem 0; margin: 1.75rem 0; color: #4b5563; font-style: italic; }
        .page-content img { border-radius: 1.25rem; max-width: 100%; margin: 2rem auto; display: block; box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}
