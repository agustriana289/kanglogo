"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Loader2, Save, ArrowLeft, ChevronDown, ChevronUp, HelpCircle, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  target: "landing" | "service" | "shop";
  service_id: string | null;
  shop_category: string | null;
  sort_order: number;
  is_published: boolean;
}

interface Service {
  id: string;
  title: string;
}

const SHOP_CATEGORIES = ["Logo", "Icon", "Template", "Banner", "Vector", "Graphic Pack"];

const emptyForm: Omit<FAQ, "id"> = {
  question: "",
  answer: "",
  target: "landing",
  service_id: null,
  shop_category: null,
  sort_order: 0,
  is_published: true,
};

export default function FAQClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<FAQ, "id">>(emptyForm);
  const [filterTarget, setFilterTarget] = useState<"all" | "landing" | "service" | "shop">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: faqData }, { data: serviceData }] = await Promise.all([
      supabase.from("faqs").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("store_services").select("id, title").eq("is_published", true).order("title"),
    ]);
    setFaqs((faqData as FAQ[]) || []);
    setServices((serviceData as Service[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.sort_order)) : -1;
    setEditingFaq(null);
    setForm({ ...emptyForm, sort_order: maxOrder + 1 });
    setView("form");
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      target: faq.target,
      service_id: faq.service_id,
      shop_category: faq.shop_category,
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setView("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question || !form.answer) return showToast("Question and answer are required", "error");
    setSaving(true);

    const payload = {
      ...form,
      service_id: form.target === "service" ? form.service_id : null,
      shop_category: form.target === "shop" ? form.shop_category : null,
    };

    if (editingFaq) {
      const { error } = await supabase.from("faqs").update(payload).eq("id", editingFaq.id);
      if (error) showToast(error.message, "error");
      else { showToast("FAQ updated", "success"); setView("list"); fetchData(); }
    } else {
      const { error } = await supabase.from("faqs").insert(payload);
      if (error) showToast(error.message, "error");
      else { showToast("FAQ created", "success"); setView("list"); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) showToast("Failed to delete", "error");
    else { showToast("FAQ deleted", "success"); fetchData(); }
  };

  const togglePublish = async (faq: FAQ) => {
    const { error } = await supabase.from("faqs").update({ is_published: !faq.is_published }).eq("id", faq.id);
    if (error) showToast("Failed to update", "error");
    else fetchData();
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  const filtered = faqs.filter(f => filterTarget === "all" || f.target === filterTarget);

  const targetBadge = (target: string) => {
    if (target === "landing") return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">Landing</span>;
    if (target === "service") return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">Service</span>;
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600">Shop</span>;
  };

  if (view === "form") {
    return (
      <div className="pt-6 px-4 pb-16 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to FAQs
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingFaq ? "Update FAQ" : "Save FAQ"}
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            {editingFaq ? "Edit FAQ" : "New FAQ"}
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target</label>
            <div className="flex gap-2">
              {(["landing", "service", "shop"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, target: t, service_id: null, shop_category: null }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${form.target === t ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {form.target === "service" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Service</label>
              <select
                value={form.service_id || ""}
                onChange={e => setForm(p => ({ ...p, service_id: e.target.value || null }))}
                className={inputClass}
              >
                <option value="">— Select a Service —</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          {form.target === "shop" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shop Category</label>
              <select
                value={form.shop_category || ""}
                onChange={e => setForm(p => ({ ...p, shop_category: e.target.value || null }))}
                className={inputClass}
              >
                <option value="">— All Categories —</option>
                {SHOP_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Question</label>
            <input
              required
              value={form.question}
              onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
              placeholder="e.g. How long does it take to deliver?"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Answer</label>
            <textarea
              required
              rows={5}
              value={form.answer}
              onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
              placeholder="Write the answer..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 h-[46px]">
                <span className="text-sm font-bold text-slate-700">{form.is_published ? "Published" : "Draft"}</span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))}
                  className={`w-11 h-6 rounded-full relative transition-all ${form.is_published ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_published ? "right-1" : "left-1"}`} />
                </button>
              </div>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">FAQ Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage frequently asked questions for landing page, services, and shop.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> New FAQ
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
          {(["all", "landing", "service", "shop"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterTarget(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterTarget === t ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <HelpCircle className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">No FAQs yet</p>
            <p className="text-xs mt-1">Click &apos;New FAQ&apos; to add your first question.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(faq => (
              <div key={faq.id} className="hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-4 px-6 py-4">
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    {expandedId === faq.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {targetBadge(faq.target)}
                      {faq.target === "service" && faq.service_id && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {services.find(s => s.id === faq.service_id)?.title || "Unknown"}
                        </span>
                      )}
                      {faq.target === "shop" && faq.shop_category && (
                        <span className="text-[10px] text-slate-400 font-medium">{faq.shop_category}</span>
                      )}
                      {!faq.is_published && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400">Draft</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800">{faq.question}</p>
                    {expandedId === faq.id && (
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePublish(faq)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${faq.is_published ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-400"}`}
                      title={faq.is_published ? "Unpublish" : "Publish"}
                    >
                      <div className={`w-2 h-2 rounded-full ${faq.is_published ? "bg-emerald-500" : "bg-slate-300"}`} />
                    </button>
                    <button
                      onClick={() => openEdit(faq)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
