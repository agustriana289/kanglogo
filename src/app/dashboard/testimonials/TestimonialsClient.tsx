"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Star, User, Loader2, Trash2, Edit, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

export default function TestimonialsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit Modal States
  const [orders, setOrders] = useState<any[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: "",
    order_id: "",
    custom_project_title: "",
  });

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("users").select("id, full_name, email, avatar_url");
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { if (p.id) profileMap[p.id] = p; });

      const { data, error } = await supabase
        .from("store_testimonials")
        .select("*, store_orders(order_number, form_data, store_products(title), store_services(title))")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTestimonials((data || []).map((t: any) => ({ ...t, client: t.user_id ? profileMap[t.user_id] || null : null })));
    } catch (error: any) {
      showToast(error.message || "Failed to fetch testimonials", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  const fetchOrders = async () => {
    setFetchingOrders(true);
    const { data } = await supabase
      .from("store_orders")
      .select("id, order_number, store_products(title), store_services(title), form_data")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setFetchingOrders(false);
  };

  const openEditModal = (t: any) => {
    if (orders.length === 0) fetchOrders();
    setEditingId(t.id);
    setEditForm({
      client_name: t.client_name || "",
      order_id: t.order_id || "",
      custom_project_title: t.custom_project_title || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    
    // Check if order unique constraint is violated
    if (editForm.order_id) {
      const existing = testimonials.find(t => t.order_id === editForm.order_id && t.id !== editingId);
      if (existing) {
        showToast("This order already has a testimonial.", "error");
        setSavingEdit(false);
        return;
      }
    }

    const payload = {
      client_name: editForm.client_name || null,
      order_id: editForm.order_id || null,
      custom_project_title: editForm.custom_project_title || null,
    };

    const { error } = await supabase.from("store_testimonials").update(payload).eq("id", editingId);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Testimonial updated successfully", "success");
      setIsEditModalOpen(false);
      fetchTestimonials();
    }
    setSavingEdit(false);
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("store_testimonials").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else { showToast("Testimonial deleted", "success"); fetchTestimonials(); }
  };

  const getProjectTitle = (t: any) => {
    if (t.custom_project_title) return t.custom_project_title;
    
    const order = t.store_orders;
    if (!order) return "Project";

    const baseTitle = order.store_products?.title || order.store_services?.title || "Project";
    try {
      const fd = typeof order.form_data === "string" ? JSON.parse(order.form_data) : order.form_data;
      const note = fd?.["Project Title"] || fd?.["Nama Logo"] || fd?.["nama_logo"];
      return note ? `${baseTitle} — ${note}` : baseTitle;
    } catch { return baseTitle; }
  };

  const getOrderTitleSafe = (order: any) => {
    const baseTitle = order.store_products?.title || order.store_services?.title || "Project";
    try {
      const fd = typeof order.form_data === "string" ? JSON.parse(order.form_data) : order.form_data;
      const note = fd?.["Project Title"] || fd?.["Nama Logo"] || fd?.["nama_logo"];
      return note ? `${baseTitle} - ${note}` : baseTitle;
    } catch { return baseTitle; }
  };

  const avgRating = (t: any) => {
    const vals = [t.rating_quality, t.rating_communication, t.rating_speed].filter(Boolean);
    if (!vals.length) return 5; // fallback to 5 if empty
    return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
  };

  const filtered = testimonials.filter(t => {
    const name = t.client_name || t.client?.full_name || t.client?.email || "";
    const comment = t.comment || "";
    const order = t.store_orders?.order_number || "";
    const project = t.custom_project_title || "";
    const s = search.toLowerCase();
    return name.toLowerCase().includes(s) || comment.toLowerCase().includes(s) || order.toLowerCase().includes(s) || project.toLowerCase().includes(s);
  });

  const stats = {
    total: testimonials.length,
    avgQuality: testimonials.length ? (testimonials.reduce((a, t) => a + (t.rating_quality || 0), 0) / testimonials.length).toFixed(1) : "–",
    avgSpeed: testimonials.length ? (testimonials.reduce((a, t) => a + (t.rating_speed || 0), 0) / testimonials.length).toFixed(1) : "–",
    avgComms: testimonials.length ? (testimonials.reduce((a, t) => a + (t.rating_communication || 0), 0) / testimonials.length).toFixed(1) : "–",
  };

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Client Testimonials</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review and manage feedback from your clients.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Reviews", value: stats.total },
          { label: "Avg Quality", value: stats.avgQuality },
          { label: "Avg Speed", value: stats.avgSpeed },
          { label: "Avg Comms", value: stats.avgComms },
        ].map((s, i) => (
          <div key={i} className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, project, or comment..."
              className="w-full bg-slate-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <Star className="w-10 h-10 mb-3" />
            <p className="text-sm font-bold text-slate-400">No testimonials yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Client & Project</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => {
                  const avg = avgRating(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                            {t.client?.avatar_url ? (
                              <img src={t.client.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{t.client_name || t.client?.full_name || t.client?.email?.split("@")[0] || "Unknown Client"}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 max-w-[200px] truncate" title={getProjectTitle(t)}>{getProjectTitle(t)}</p>
                            {t.store_orders?.order_number && (
                              <p className="font-mono text-[10px] text-slate-300">#{t.store_orders.order_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 mb-1 text-amber-400">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`w-4 h-4 ${idx < Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {avg.toFixed(1)} / 5.0
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <p className="text-sm font-medium text-slate-500 italic leading-relaxed line-clamp-3">
                          &ldquo;{t.comment || "No comment provided."}&rdquo;
                        </p>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-400">
                          {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(t)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Properties">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteTestimonial(t.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Testimonial">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Edit Testimonial Details
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Display Client Name</label>
                <input
                  type="text"
                  value={editForm.client_name}
                  onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                  placeholder="Override default client name..."
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Leave empty to use user's original account name.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Link to Order Project</label>
                <div className="relative">
                  <select
                    value={editForm.order_id || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, order_id: e.target.value }))}
                    disabled={fetchingOrders}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 p-3 transition-all outline-none appearance-none disabled:opacity-50"
                  >
                    <option value="">-- No Order Linked --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} — {getOrderTitleSafe(o)}
                      </option>
                    ))}
                  </select>
                  {fetchingOrders && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Custom Project Title</label>
                <input
                  type="text"
                  value={editForm.custom_project_title}
                  onChange={(e) => setEditForm({ ...editForm, custom_project_title: e.target.value })}
                  placeholder="E.g. Branding Toko Baju..."
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium mb-1">
                  If filled, this will replace the project title displayed on the public page.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="flex-2 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60">
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
