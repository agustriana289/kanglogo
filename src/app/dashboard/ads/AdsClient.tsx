"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Megaphone, ArrowLeft, Save, Globe, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface Ad {
  id: number;
  name: string;
  position: string;
  html_code: string;
  is_active: boolean;
}

const POSITIONS: Record<string, string> = {
  above_date: "Above Article Date",
  article_middle: "Middle of Article",
  article_end: "End of Article",
  after_recent: "After Recent Articles",
};

const emptyForm = { name: "", position: "above_date", html_code: "", is_active: true };

export default function AdsClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    setAds(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const openNew = () => {
    setEditingAd(null);
    setForm(emptyForm);
    setView("form");
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setForm({ name: ad.name, position: ad.position, html_code: ad.html_code, is_active: ad.is_active });
    setView("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.html_code) return showToast("Name and HTML code are required", "error");
    setSaving(true);
    if (editingAd) {
      const { error } = await supabase.from("ads").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editingAd.id);
      if (error) showToast("Failed to update ad", "error");
      else { showToast("Ad updated", "success"); setView("list"); fetchAds(); }
    } else {
      const { error } = await supabase.from("ads").insert(form);
      if (error) showToast("Failed to create ad", "error");
      else { showToast("Ad created", "success"); setView("list"); fetchAds(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this ad?")) return;
    await supabase.from("ads").delete().eq("id", id);
    showToast("Ad deleted", "success");
    fetchAds();
  };

  const handleToggle = async (ad: Ad) => {
    await supabase.from("ads").update({ is_active: !ad.is_active }).eq("id", ad.id);
    fetchAds();
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  if (view === "form") {
    return (
      <div className="pt-6 px-4 pb-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingAd ? "Update Ad" : "Save Ad"}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ad Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Google AdSense - Article Middle"
                className={`${inputClass} text-base font-semibold`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Position</label>
              <select
                value={form.position}
                onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                className={inputClass}
              >
                {Object.entries(POSITIONS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">HTML / Ad Code</label>
              <textarea
                required
                rows={8}
                value={form.html_code}
                onChange={e => setForm(p => ({ ...p, html_code: e.target.value }))}
                placeholder="Paste your Google AdSense or any HTML ad code here..."
                className={`${inputClass} font-mono text-xs leading-relaxed resize-none`}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                  {form.is_active ? <Globe className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{form.is_active ? "Active" : "Inactive"}</p>
                  <p className="text-xs text-slate-400">{form.is_active ? "Ad is visible on articles" : "Ad is hidden"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`w-11 h-6 rounded-full relative transition-all ${form.is_active ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_active ? "right-1" : "left-1"}`} />
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ads Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage ad placements across your blog articles.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> New Ad
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Megaphone className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">No ads yet</p>
            <p className="text-xs mt-1">Create your first ad placement</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ads.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{ad.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {POSITIONS[ad.position] || ad.position}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(ad)} className="flex items-center gap-1.5 text-xs font-semibold">
                      {ad.is_active
                        ? <><ToggleRight className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600">Active</span></>
                        : <><ToggleLeft className="w-4 h-4 text-slate-400" /><span className="text-slate-400">Inactive</span></>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(ad)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(ad.id)} className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
