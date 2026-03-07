"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Type, Globe, CheckCircle, Clock, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import RichTextEditor from "@/components/RichTextEditor";

export default function NewBlogPage() {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    category: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    is_published: true,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setFormData(prev => ({ ...prev, title, slug, meta_title: title }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("blogs").insert([{
        ...formData,
        published_at: formData.is_published ? new Date().toISOString() : null,
      }]);
      if (error) throw error;
      showToast("Blog post created successfully!", "success");
      router.push("/dashboard/blogs");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  return (
    <div className="pt-6 px-4 pb-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/blogs" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Publish Post
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Article Title</label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Write a compelling article title..."
                  className={`${inputClass} pl-10 text-lg font-semibold placeholder:font-normal placeholder:text-slate-300`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Excerpt / Summary</label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Short preview of your article..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={content => setFormData(prev => ({ ...prev, content }))}
              />
            </div>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Search className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">SEO Optimization</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">SEO Title</label>
                  <input value={formData.meta_title} onChange={e => setFormData(prev => ({ ...prev, meta_title: e.target.value }))} className={inputClass} placeholder="Title for search engines" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">SEO Keywords</label>
                  <input value={formData.meta_keywords} onChange={e => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))} className={inputClass} placeholder="logo design, branding, tips" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">SEO Description</label>
                <textarea
                  rows={5}
                  value={formData.meta_description}
                  onChange={e => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  className={`${inputClass} resize-none h-[130px]`}
                  placeholder="Compelling description for search results..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Featured Image</h3>
            </div>
            <div className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-300">
              {formData.featured_image ? (
                <img src={formData.featured_image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
            </div>
            <input
              value={formData.featured_image}
              onChange={e => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
              className={inputClass}
              placeholder="Paste image URL..."
            />
          </div>

          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Category & URL</h3>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
              <input
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Branding, Design Tips, Logo"
              />
              <p className="text-xs text-slate-400 mt-1.5">Pisahkan dengan koma untuk beberapa kategori</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Article Slug</label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <span className="text-slate-400 text-sm font-medium shrink-0">/blog/</span>
                <input
                  required
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="bg-transparent border-none p-0 text-sm font-bold text-indigo-600 focus:ring-0 w-full outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Publishing</h3>
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
