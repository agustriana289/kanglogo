"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight, Rss } from "lucide-react";

export default function LatestPostsClient({ blogs }: { blogs: any[] }) {
  return (
    <div className="pt-6 px-4 pb-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Latest Posts</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Read our latest news, articles, and insights.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
          <Rss className="w-6 h-6" />
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No posts available</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">There are no blog posts published yet. Stay tuned!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {blogs.map((b) => (
            <Link 
              key={b.id} 
              href={`/blogs/${b.slug}`}
              className="group bg-white rounded-2xl ring-1 ring-slate-100 flex flex-col sm:flex-row overflow-hidden hover:shadow-md hover:ring-indigo-100 transition-all duration-300"
            >
               <div className="w-full sm:w-64 h-48 sm:h-auto relative overflow-hidden bg-slate-100 shrink-0">
                  <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                     <BookOpen className="w-8 h-8 text-indigo-200" />
                  </div>
                  {b.featured_image && (
                    <img 
                      src={b.featured_image} 
                      alt={b.title} 
                      className="absolute inset-0 w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-500" 
                    />
                  )}
               </div>
               
               <div className="p-6 flex-1 flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-3">
                   {b.category && (
                     <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded shadow-sm border border-indigo-100">
                       {b.category}
                     </span>
                   )}
                   <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(b.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                   </div>
                 </div>

                 <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight mb-2">
                   {b.title}
                 </h3>

                 <div className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                 </div>
               </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
