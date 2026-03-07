"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Type, Globe, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

export default function EditPagePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    meta_description: "",
    is_published: false,
  });

  const fetchPage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title,
          slug: data.slug,
          content: data.content || "",
          meta_description: data.meta_description || "",
          is_published: data.is_published,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
      router.push("/dashboard/pages");
    } finally {
      setFetching(false);
    }
  }, [params.id, supabase, showToast, router]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pages")
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq("id", params.id);
      if (error) throw error;
      showToast("Page updated successfully!", "success");
      router.push("/dashboard/pages");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/pages" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Update Page
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Page Title</label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Privacy Policy"
                  className={`${inputClass} pl-10 text-lg font-semibold placeholder:font-normal placeholder:text-slate-300`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Content (HTML Supported)</label>
              <textarea
                required
                rows={20}
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your page content here... You can use HTML tags for formatting."
                className={`${inputClass} font-mono text-sm leading-relaxed min-h-[480px] resize-none`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">SEO & URL</h3>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Page Slug</label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <span className="text-slate-400 text-sm font-medium shrink-0">/</span>
                <input
                  required
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="bg-transparent border-none p-0 text-sm font-bold text-indigo-600 focus:ring-0 w-full outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Meta Description</label>
              <textarea
                rows={4}
                value={formData.meta_description}
                onChange={e => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="Short summary for search engines..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Visibility</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${formData.is_published ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                  {formData.is_published ? <Globe className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{formData.is_published ? "Published" : "Draft"}</p>
                  <p className="text-xs text-slate-400">{formData.is_published ? "Visible to public" : "Not yet published"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                className={`w-11 h-6 rounded-full relative transition-all ${formData.is_published ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.is_published ? "right-1" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
