"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Command, ExternalLink, Calendar, SearchSlash, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  link: string;
  type: string;
  created_at: string;
}

export default function SearchClient({ isAdmin, userId }: { isAdmin: boolean, userId: string }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('global_search', {
        p_query: q,
        p_is_admin: isAdmin,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Search RPC error:', error);
        throw error;
      }
      setResults(data || []);
    } catch (error) {
      console.error('Global search error:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userId, supabase]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="pt-6 px-4 pb-16 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Search Results</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Showing all matches across the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-10 group max-w-2xl">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          className="w-full bg-white border border-slate-200 text-slate-900 sm:text-lg font-medium rounded-2xl pl-12 pr-32 py-4 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
          <p className="text-lg font-bold">Searching through the database...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-12">
          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{type}</h2>
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-xs font-bold text-slate-400">{items.length} items</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Command className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                          {item.title}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-all -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-3 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-indigo-500">{item.type}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : query.length >= 2 ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <SearchSlash className="w-16 h-16 mb-4 text-slate-200" />
          <h3 className="text-xl font-bold text-slate-900">No results found</h3>
          <p className="text-slate-500 mt-2">We couldn&apos;t find anything matching &quot;{query}&quot;</p>
          <div className="mt-8 flex gap-3 text-sm">
             <span className="px-3 py-1 bg-white rounded-lg border border-slate-200">Try different keywords</span>
             <span className="px-3 py-1 bg-white rounded-lg border border-slate-200">Check spelling</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Search className="w-16 h-16 mb-4 text-slate-200" />
          <p className="text-lg font-bold">Enter at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
}
