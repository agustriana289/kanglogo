"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, Loader2, Command, SearchSlash, ArrowRight, FolderKanban, BriefcaseBusiness, 
  ShoppingBag, Ticket, Megaphone, Images, Star, 
  BookOpen, Tv2, LayoutTemplate, HelpCircle, Users, Tags
} from "lucide-react";
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

export default function GlobalSearch({ isAdmin, userId }: { isAdmin: boolean, userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shortcut for focus (Optional improvement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        console.error('RPC Search Error Details:', error.message, error.details, error.hint);
        throw error;
      }
      setResults(data || []);
    } catch (error: any) {
      console.error('Global search error:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userId, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Grouping results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Type-to-Icon Mapping (Matching Sidebar)
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'project': return FolderKanban;
      case 'service': return BriefcaseBusiness;
      case 'shop': return ShoppingBag;
      case 'ticket': return Ticket;
      case 'announcement': return Megaphone;
      case 'portfolio': return Images;
      case 'testimonial': return Star;
      case 'blog': return BookOpen;
      case 'ad': return Tv2;
      case 'page': return LayoutTemplate;
      case 'faq': return HelpCircle;
      case 'user': case 'user profile': return Users;
      case 'discount': return Tags;
      default: return Command;
    }
  };

  return (
    <div className="relative flex-1 lg:max-w-[320px] xl:max-w-md w-full ml-6" ref={dropdownRef}>
      {/* Search Input Trigger */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search everything..."
          className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl pl-11 pr-12 py-2.5 transition-all outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white shadow-sm placeholder:text-slate-400 placeholder:font-medium ${isOpen ? 'border-indigo-400 bg-white shadow-md ring-4 ring-indigo-500/5' : ''}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-black text-slate-400 shadow-xs">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-3 max-h-[70vh] w-full bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100 overflow-hidden z-[100] transform transition-all animate-in fade-in slide-in-from-top-2">
          
          <div className="overflow-y-auto max-h-[calc(70vh-45px)] divide-y divide-slate-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Searching everything...</p>
              </div>
            ) : results.length > 0 ? (
              Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="pb-1">
                  <div className="sticky top-0 bg-white/90 backdrop-blur-md px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100/50 mb-1 z-10 flex justify-between select-none">
                    <span>{type}</span>
                    <span className="text-slate-300 font-medium lowercase tracking-normal">{items.length} item{items.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="px-2 space-y-1">
                    {items.map((item) => {
                      const Icon = getIcon(item.type);
                      return (
                        <Link
                          key={item.id}
                          href={item.link}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-slate-50 transition-all group mx-1 border border-transparent hover:border-slate-100 hover:shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-indigo-600 transition-all border border-slate-200/40 shadow-xs group-hover:shadow-indigo-100/30 group-hover:-translate-y-0.5">
                            <Icon size={18} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs font-medium text-slate-400 truncate max-w-[180px]">{item.description}</p>
                              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <SearchSlash className="w-10 h-10 mb-3 text-slate-200" />
                <p className="text-sm font-bold">No results found for &quot;{query}&quot;</p>
                <p className="text-xs mt-1">Try different keywords or check spelling.</p>
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {results.length > 5 ? (
                <Link 
                  href={`/dashboard/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600 hover:text-indigo-800 flex items-center gap-2 transition-all group/btn"
                >
                  View all results <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
            ) : (
              <div className="flex gap-4">
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                   <kbd className="h-4 px-1 rounded border border-slate-200 bg-white">ESC</kbd> to close
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
