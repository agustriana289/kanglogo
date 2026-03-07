"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Ticket,
  Zap,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Tag,
  Percent,
  CircleDollarSign,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

export default function DiscountsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    min_purchase: 0,
    max_discount: null,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: "",
    usage_limit: null,
    is_active: true,
    product_id: null,
    service_id: null
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ds, ps, ss] = await Promise.all([
        supabase.from("store_discounts").select(`*, store_products(title), store_services(title)`).order("created_at", { ascending: false }),
        supabase.from("store_products").select("id, title"),
        supabase.from("store_services").select("id, title")
      ]);

      if (ds.error) throw ds.error;
      setDiscounts(ds.data || []);
      setProducts(ps.data || []);
      setServices(ss.data || []);
    } catch (error: any) {
      showToast(error.message || "Failed to fetch discounts", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Process form data
    const payload = { ...formData };
    if (!payload.code) payload.code = null;
    if (payload.max_discount === "") payload.max_discount = null;
    if (payload.usage_limit === "") payload.usage_limit = null;
    if (payload.end_date === "") payload.end_date = null;

    try {
      if (editingId) {
        const { error } = await supabase.from("store_discounts").update(payload).eq("id", editingId);
        if (error) throw error;
        showToast("Discount updated successfully", "success");
      } else {
        const { error } = await supabase.from("store_discounts").insert(payload);
        if (error) throw error;
        showToast("Discount created successfully", "success");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return;
    try {
      const { error } = await supabase.from("store_discounts").delete().eq("id", id);
      if (error) throw error;
      showToast("Discount deleted", "success");
      fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from("store_discounts").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      setDiscounts(discounts.map(d => d.id === id ? { ...d, is_active: !current } : d));
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const openAdd = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      min_purchase: 0,
      max_discount: null,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: "",
      usage_limit: null,
      is_active: true,
      product_id: null,
      service_id: null
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (d: any) => {
    setFormData({
      code: d.code || "",
      name: d.name,
      description: d.description || "",
      type: d.type,
      value: d.value,
      min_purchase: d.min_purchase,
      max_discount: d.max_discount,
      start_date: new Date(d.start_date).toISOString().slice(0, 16),
      end_date: d.end_date ? new Date(d.end_date).toISOString().slice(0, 16) : "",
      usage_limit: d.usage_limit,
      is_active: d.is_active,
      product_id: d.product_id,
      service_id: d.service_id
    });
    setEditingId(d.id);
    setIsModalOpen(true);
  };

  const filtered = discounts.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code?.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Discounts & Vouchers</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage promo codes and automated service discounts.</p>
        </div>
        <button 
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> Create Promo
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search promo name or code..." 
              className="w-full bg-slate-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Promo Info</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Validity</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Ticket className="w-10 h-10 mb-3 text-slate-200" />
                      <p className="text-sm font-bold">No discounts found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm ${d.code ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                        {d.code ? <Ticket className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{d.name}</p>
                        {d.code && (
                          <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md w-fit mt-1 tracking-wider border border-indigo-100">CODE: {d.code}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-500 inline-flex items-center justify-center">
                      {d.product_id ? (
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {d.store_products?.title}</span>
                      ) : d.service_id ? (
                        <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {d.store_services?.title}</span>
                      ) : (
                        <span className="text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded-full tracking-wider">Global Voucher</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-900">
                      {d.type === 'percentage' ? `${d.value}% OFF` : `Rp ${new Intl.NumberFormat('id-ID').format(d.value)}`}
                    </p>
                    {d.min_purchase > 0 && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1">MIN: Rp {new Intl.NumberFormat('id-ID').format(d.min_purchase)}</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Start: {new Date(d.start_date).toLocaleDateString()}</p>
                      {d.end_date ? (
                        <p className={`text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${new Date(d.end_date) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> Ends: {new Date(d.end_date).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">No Expiry</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all rounded-full" 
                          style={{ width: `${d.usage_limit ? Math.min((d.used_count / d.usage_limit) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{d.used_count} / {d.usage_limit || '∞'}</span>
                    </div>
                    {d.used_count >= d.usage_limit && d.usage_limit !== null && (
                       <p className="text-[10px] font-bold text-red-500 mt-1.5 uppercase tracking-wider">Sold Out</p>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => toggleActive(d.id, d.is_active)}
                        className={`p-2 rounded-lg transition-colors border ${d.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                        title="Toggle Active Status"
                      >
                        {d.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(d)} className="p-2 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="Edit Discount">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteDiscount(d.id)} className="p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Delete Discount">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{editingId ? 'Edit Promo' : 'New Promotion'}</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Setup vouchers or automatic service discounts</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Promo Type / Mode</label>
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, code: "PROMOCODE"})}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${formData.code !== "" ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Ticket className="w-4 h-4" /> VOUCHER
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, code: ""})}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${formData.code === "" ? 'bg-white text-orange-500 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Zap className="w-4 h-4" /> AUTOMATIC
                      </button>
                    </div>
                  </div>

                  {formData.code !== "" && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Voucher Code</label>
                      <input 
                        type="text"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. FLASH2026"
                        className={`${inputClass} font-mono uppercase text-indigo-600`}
                        required={formData.code !== ""}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Internal Promo Name</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramadhan Big Sale"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Discount Type</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className={inputClass}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed_amount">Fixed Amount (Rp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Value</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={formData.value || ""}
                          onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                          className={`${inputClass} pr-10`}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {formData.type === 'percentage' ? <Percent className="w-4 h-4" /> : <CircleDollarSign className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {formData.code === "" && (
                    <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-orange-600">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Automatic Target</span>
                      </div>
                      <select 
                        value={formData.product_id || formData.service_id || ""}
                        onChange={e => {
                          const val = e.target.value;
                          const isService = services.some(s => s.id === val);
                          setFormData({ ...formData, product_id: isService ? null : val || null, service_id: isService ? val : null });
                        }}
                        className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-200 outline-none shadow-sm"
                      >
                        <option value="">Global (All Services/Shop)</option>
                        <optgroup label="Shop Products">
                          {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </optgroup>
                        <optgroup label="Professional Services">
                          {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </optgroup>
                      </select>
                      <p className="text-[10px] font-medium text-orange-500 leading-relaxed max-w-xs flex gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Automatic discounts will be applied directly without code at checkout.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Min. Purchase</label>
                      <input 
                        type="number"
                        value={formData.min_purchase || ""}
                        onChange={e => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Usage Limit</label>
                      <input 
                        type="number"
                        value={formData.usage_limit || ""}
                        onChange={e => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="∞"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Starts At</label>
                      <input 
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Ends At</label>
                      <input 
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Internal Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Notes for admin..."
                      className={`${inputClass} min-h-[140px] resize-none`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-2 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Promotion" : "Create Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
