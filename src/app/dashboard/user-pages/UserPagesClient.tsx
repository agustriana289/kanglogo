"use client";

import React from "react";
import Link from "next/link";
import { LayoutTemplate, FileText, ArrowRight } from "lucide-react";

export default function UserPagesClient({ pages }: { pages: any[] }) {
  return (
    <div className="pt-6 px-4 pb-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Explore Pages</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Useful resources and references available for you.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
          <LayoutTemplate className="w-6 h-6" />
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No pages available</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">There are no internal pages published for users yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pages.map((p) => (
            <Link 
              key={p.id} 
              href={`/pages/${p.slug}`}
              className="group bg-white rounded-2xl ring-1 ring-slate-100 flex flex-col sm:flex-row items-center hover:shadow-md hover:ring-indigo-100 transition-all duration-300 relative overflow-hidden"
            >
               <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 bg-indigo-500" />
               
               <div className="flex items-center gap-4 p-6 shrink-0 relative z-10 sm:w-80">
                 <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                   <FileText className="w-6 h-6" />
                 </div>
                 <div className="min-w-0">
                   <h3 className="text-lg font-bold text-slate-900 truncate">{p.title}</h3>
                   <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 truncate">/{p.slug}</p>
                 </div>
               </div>

               <div className="flex-1 px-6 sm:px-0 py-4 sm:py-6 relative z-10 flex items-center justify-between gap-6 border-t sm:border-t-0 sm:border-l border-slate-100">
                 <p className="text-sm font-medium text-slate-500 line-clamp-2 max-w-xl">
                   Access detailed information regarding <strong>{p.title}</strong> directly from this page document.
                 </p>

                 <div className="shrink-0 flex items-center gap-2 text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pr-6">
                    <span>Visit Page</span>
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
