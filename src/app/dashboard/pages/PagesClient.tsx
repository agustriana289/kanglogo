"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, FileText, Globe, FileEdit, Trash2, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
}

export default function PagesClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "published" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, slug, is_published, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setPages(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const deletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
      showToast("Page deleted.", "success");
      fetchPages();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
    }
  };

  const filteredPages = pages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "all" || (tab === "published" ? p.is_published : !p.is_published);
    return matchesSearch && matchesTab;
  });

  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredPages.length / pageSize);

  if (loading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Static Pages</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your website&apos;s static content.</p>
        </div>
        <Link
          href="/dashboard/pages/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          New Page
        </Link>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by title or slug..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {(["all", "published", "draft"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === t ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Page</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPages.map(page => (
                <tr key={page.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{page.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-500 font-mono">/{page.slug}</code>
                  </td>
                  <td className="px-6 py-4">
                    {page.is_published ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {new Date(page.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/pages/${page.slug}`} target="_blank" className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="View public page">
                        <Globe className="w-4 h-4" />
                      </Link>
                      <Link href={`/dashboard/pages/${page.id}/edit`} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                        <FileEdit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deletePage(page.id)} className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedPages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">No pages found.</p>
                    <p className="text-xs text-slate-400 mt-1">Create your first page to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
