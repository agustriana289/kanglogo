"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, ArrowRight, Tag, Star, LayoutGrid, List } from "lucide-react";

export default function BrowseShopClient({ products }: { products: any[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Extract unique categories
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Browse Shop</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Discover premium templates, logos, and digital products.</p>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..." 
            className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 pl-9 pr-4 py-2.5 transition-all outline-none"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        {/* Categories Header */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-100 overflow-x-auto">
          {categories.map((c: string) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                activeCategory === c 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="p-6 bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
              <p className="text-sm font-medium text-slate-500 max-w-md">We couldn't find any items matching your criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredProducts.map((p) => {
                 let minPrice = 0;
                 try {
                    const pkgs = typeof p.packages === "string" ? JSON.parse(p.packages) : (p.packages || []);
                    if (pkgs.length > 0) {
                       minPrice = Math.min(...pkgs.map((x: any) => parseFloat(x.price) || 0));
                    }
                 } catch (e) {
                    minPrice = 0;
                 }

                 return (
                   <Link href={`/shop/${p.slug}`} key={p.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-indigo-100 hover:shadow-md hover:ring-1 hover:ring-indigo-100 transition-all duration-300 flex flex-col sm:flex-row">
                     <div className="w-full sm:w-64 h-48 sm:h-auto bg-slate-100 relative overflow-hidden shrink-0">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><LayoutGrid className="w-10 h-10" /></div>
                        )}
                        {p.category && (
                           <div className="absolute top-3 left-3 flex gap-2">
                             <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
                               {p.category}
                             </span>
                           </div>
                        )}
                     </div>

                     <div className="p-5 flex-1 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {p.title}
                        </h3>
                        
                        <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed mb-4 max-w-2xl">
                          {p.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Starting at</span>
                             <span className="text-lg font-black text-slate-900">
                               Rp {new Intl.NumberFormat('id-ID').format(minPrice)}
                             </span>
                           </div>

                           <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                             <span>View Details</span>
                             <ArrowRight className="w-4 h-4" />
                           </div>
                        </div>
                     </div>
                   </Link>
                 );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
