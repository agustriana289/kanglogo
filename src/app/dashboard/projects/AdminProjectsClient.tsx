"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Package, Calendar, Briefcase, Loader2,
  CheckCircle2, Clock, XCircle, CreditCard,
  X, Edit, MessageSquare, ChevronLeft, ChevronRight, Eye,
  Phone, Mail, FileText, Hash, User, Trash2, Wallet, Users, TrendingUp
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

const PAGE_SIZE = 20;

export default function AdminProjectsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "shop" | "service">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [updating, setUpdating] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<any>({
    title: "", client_name: "", total_amount: "", status: "pending",
    user_id: "", service_id: "", selected_package: null
  });
  const [creatingProject, setCreatingProject] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("users").select("id, full_name, email, avatar_url");
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { if (p.id) profileMap[p.id] = p; });

      const { data, error } = await supabase
        .from("store_orders")
        .select("*, store_products(title, category), store_services(title, category), store_workspaces(id)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders((data || []).map((o: any) => ({ ...o, client: profileMap[o.user_id] || null })));
      setUsersList(profiles || []);

      const { data: services } = await supabase.from("store_services").select("id, title, packages");
      setServicesList(services || []);

      const { data: products } = await supabase.from("store_products").select("id, title, packages");
      setProductsList(products || []);
    } catch (error: any) {
      showToast(error.message || "Failed to fetch projects", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const getFormData = (o: any) => {
    try { return typeof o.form_data === "string" ? JSON.parse(o.form_data) : (o.form_data || {}); }
    catch { return {}; }
  };

  const getProjectTitle = (o: any) => {
    const fd = getFormData(o);
    const baseTitle = o.store_services?.title || o.store_products?.title;
    try {
      const pkg = typeof o.selected_package === "string" ? JSON.parse(o.selected_package) : (o.selected_package || {});
      const pkgName = pkg?.name || "";
      const projectNote = fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
      if (baseTitle && projectNote) return `${baseTitle} — ${projectNote}`;
      if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
      if (baseTitle) return baseTitle;
      if (pkgName && projectNote) return `${pkgName} — ${projectNote}`;
      return pkgName || fd.customer_name || "Project";
    } catch {
      return baseTitle || "Project";
    }
  };

  const getClientName = (o: any) => {
    if (o.client?.full_name) return o.client.full_name;
    if (o.client?.email) return o.client.email.split("@")[0];
    const fd = getFormData(o);
    return fd.customer_name || fd["Client Name"] || "Unknown Client";
  };

  const getClientEmail = (o: any) => {
    if (o.client?.email) return o.client.email;
    const fd = getFormData(o);
    return fd.customer_email || null;
  };

  const getClientWhatsapp = (o: any) => {
    const fd = getFormData(o);
    return fd.whatsapp || null;
  };

  const getClientInitial = (o: any) => getClientName(o).substring(0, 2).toUpperCase();

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("store_orders").update({ status }).eq("id", id);
    if (error) return showToast("Failed to update status", "error");
    showToast(`Status updated to ${status}`, "success");
    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error } = await supabase.from("store_orders").delete().eq("id", id);
    if (error) return showToast("Failed to delete project", "error");
    showToast("Project deleted", "success");
    setIsDetailModalOpen(false);
    fetchOrders();
  };

  const openDetailModal = (project: any) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setSelectedProject(project);
    const fd = getFormData(project);
    setEditFormData({
      status: project.status,
      total_amount: project.total_amount,
      payment_method: project.payment_method || "",
      progress: project.progress ?? 0,
      customer_name: fd.customer_name || fd["Client Name"] || "",
      customer_email: fd.customer_email || "",
      whatsapp: fd.whatsapp || "",
      project_title: fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "",
      service_id: project.service_id || "",
      product_id: project.product_id || "",
      selected_package: typeof project.selected_package === "object" ? JSON.stringify(project.selected_package, null, 2) : (project.selected_package || ""),
    });
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || updating) return;
    setUpdating(true);
    const currentFd = getFormData(selectedProject);
    const updatedFd = {
      ...currentFd,
      customer_name: editFormData.customer_name,
      customer_email: editFormData.customer_email,
      whatsapp: editFormData.whatsapp,
      "Project Title": editFormData.project_title,
      custom_item_name: editFormData.custom_item_name || undefined,
      custom_package_name: editFormData.custom_package_name || undefined,
    };
    const resolvedPackage = editFormData.service_id || editFormData.product_id
      ? editFormData.selected_package
      : editFormData.custom_package_name || editFormData.selected_package || null;
    const { error } = await supabase.from("store_orders")
      .update({
        status: editFormData.status,
        total_amount: editFormData.total_amount,
        payment_method: editFormData.payment_method,
        progress: editFormData.progress,
        form_data: updatedFd,
        service_id: editFormData.service_id || null,
        product_id: editFormData.product_id || null,
        selected_package: resolvedPackage,
      })
      .eq("id", selectedProject.id);
    if (error) { showToast(error.message, "error"); }
    else { showToast("Project updated", "success"); setIsEditModalOpen(false); fetchOrders(); }
    setUpdating(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingProject) return;
    if (!createFormData.service_id || !createFormData.selected_package || !createFormData.title || !createFormData.total_amount) {
      return showToast("Service, Package, Title, and Amount are required", "error");
    }
    setCreatingProject(true);
    try {
      const orderNumber = `MANUAL-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
      const { error } = await supabase.from("store_orders").insert({
        order_number: orderNumber,
        status: createFormData.status,
        total_amount: parseInt(createFormData.total_amount) || 0,
        payment_method: "Manual",
        form_data: { "Project Title": createFormData.title, customer_name: createFormData.client_name },
        user_id: createFormData.user_id || null,
        service_id: createFormData.service_id,
        selected_package: createFormData.selected_package
      });
      if (error) throw error;
      showToast("Project created successfully", "success");
      setIsCreateModalOpen(false);
      setCreateFormData({ title: "", client_name: "", total_amount: "", status: "pending", user_id: "", service_id: "", selected_package: null });
      fetchOrders();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setCreatingProject(false);
    }
  };

  const filtered = orders.filter(o => {
    const itemTitle = getProjectTitle(o).toLowerCase();
    const clientName = getClientName(o).toLowerCase();
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      itemTitle.includes(search.toLowerCase()) ||
      clientName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesTab = tab === "all" || (tab === "shop" && o.product_id) || (tab === "service" && o.service_id);
    return matchesSearch && matchesStatus && matchesTab;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    waiting_payment: "bg-yellow-50 text-yellow-700 border-yellow-100",
    paid: "bg-indigo-50 text-indigo-700 border-indigo-100",
    processing: "bg-blue-50 text-blue-700 border-blue-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
  };

  const inputClass = "w-full bg-slate-50 border-0 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 p-3 transition-all outline-none";

  // Calculation for Cards
  const completedStats = orders.filter(o => ['paid', 'processing', 'completed'].includes(o.status));

  const clientStats: Record<string, { count: number; amount: number; name: string }> = {};
  let topClient = { name: "No orders yet", count: 0, amount: 0 };
  
  const itemStats: Record<string, { count: number; amount: number; name: string }> = {};
  let topItem = { name: "No orders yet", count: 0, amount: 0 };

  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  let monthlyOrderCount = 0;
  let monthlyOrderAmount = 0;

  let totalOrderCount = completedStats.length;
  let totalOrderAmount = 0;

  completedStats.forEach(o => {
    const amt = Number(o.total_amount || 0);
    totalOrderAmount += amt;

    const d = new Date(o.created_at);
    if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear) {
      monthlyOrderCount++;
      monthlyOrderAmount += amt;
    }

    const cName = getClientName(o);
    if (!clientStats[cName]) clientStats[cName] = { count: 0, amount: 0, name: cName };
    clientStats[cName].count++;
    clientStats[cName].amount += amt;
    if (clientStats[cName].count > topClient.count) topClient = clientStats[cName];

    const iName = o.store_services?.title || o.store_products?.title || "Project";
    if (!itemStats[iName]) itemStats[iName] = { count: 0, amount: 0, name: iName };
    itemStats[iName].count++;
    itemStats[iName].amount += amt;
    if (itemStats[iName].count > topItem.count) topItem = itemStats[iName];
  });

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage all incoming orders and service requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["all", "shop", "service"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${tab === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors">
            <Briefcase className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Top Client", value: topClient.name, tag: `${topClient.count} Order(s) • Rp ${topClient.amount.toLocaleString("id-ID")}`, icon: Users, color: "text-indigo-500" },
          { title: "Top Service/Shop", value: topItem.name, tag: `${topItem.count} Order(s) • Rp ${topItem.amount.toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-blue-500" },
          { title: "Monthly Orders", value: `${monthlyOrderCount} Order(s)`, tag: `Rp ${monthlyOrderAmount.toLocaleString("id-ID")}`, icon: Calendar, color: "text-emerald-500" },
          { title: "Total Orders", value: `${totalOrderCount} Order(s)`, tag: `Rp ${totalOrderAmount.toLocaleString("id-ID")}`, icon: Wallet, color: "text-amber-500" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 ring-1 ring-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <h3 className="text-sm font-bold">{s.title}</h3>
            </div>
            <span className="text-xl font-bold text-slate-900 block mb-2 line-clamp-1" title={s.value}>{s.value}</span>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">{s.tag}</p>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order ID, project name, or client..."
              className="w-full bg-slate-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 min-w-[160px] outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="waiting_payment">Waiting Payment</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Briefcase className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">No projects found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4">Order Info</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                            {o.service_id ? <Briefcase className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 max-w-[260px] truncate">{getProjectTitle(o)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">#{o.order_number}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                            {getClientInitial(o)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{getClientName(o)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {o.client ? "Registered user" : "Offline client"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">Rp {Number(o.total_amount || 0).toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{o.payment_method || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm border ${statusColors[o.status] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openDetailModal(o)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="View Detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link href={`/workspace/${o.id}`}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Go to Workspace">
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-slate-100 text-slate-600"}`}>
                        {p}
                      </button>
                    ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Order Detail</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">#{selectedProject.order_number}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project</p>
                  <p className="text-sm font-bold text-slate-900">{getProjectTitle(selectedProject)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColors[selectedProject.status] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
                    {selectedProject.status.replace("_", " ")}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Amount</p>
                  <p className="text-sm font-bold text-slate-900">Rp {Number(selectedProject.total_amount || 0).toLocaleString("id-ID")}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedProject.payment_method || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(selectedProject.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Client Information</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                      {getClientInitial(selectedProject)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{getClientName(selectedProject)}</p>
                      <p className="text-[10px] text-slate-400">{selectedProject.client ? "Registered user" : "Offline client"}</p>
                    </div>
                  </div>
                  {getClientEmail(selectedProject) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium">{getClientEmail(selectedProject)}</span>
                    </div>
                  )}
                  {getClientWhatsapp(selectedProject) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium">{getClientWhatsapp(selectedProject)}</span>
                    </div>
                  )}
                  {selectedProject.client?.id && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[10px] text-slate-400">{selectedProject.client.id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Selected Package</p>
                <div className="bg-slate-50 rounded-xl p-4">
                  {(() => {
                    const pkg = typeof selectedProject.selected_package === "string"
                      ? JSON.parse(selectedProject.selected_package)
                      : selectedProject.selected_package;
                    return (
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-2">{pkg?.name || "—"}</p>
                        {pkg?.finalPrice && <p className="text-xs text-slate-500 mb-2">Price: {pkg.finalPrice}</p>}
                        {pkg?.duration && <p className="text-xs text-slate-500 mb-2">Duration: {pkg.duration} days</p>}
                        {Array.isArray(pkg?.features) && pkg.features.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {pkg.features.map((f: string, i: number) => (
                              <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Order Reference</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs text-slate-600">{selectedProject.order_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-400 break-all">{selectedProject.id}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => openEditModal(selectedProject)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Edit className="w-4 h-4" /> Edit Project
              </button>
              <button
                onClick={() => { setIsDetailModalOpen(false); deleteOrder(selectedProject.id); }}
                className="inline-flex items-center justify-center gap-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-sm font-bold transition-colors border border-red-100">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Project</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">#{selectedProject.order_number}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Info</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Status</label>
                  <select value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })} className={inputClass}>
                    <option value="pending">Pending</option>
                    <option value="waiting_payment">Waiting Payment</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Payment Method</label>
                  <input type="text" value={editFormData.payment_method} onChange={e => setEditFormData({ ...editFormData, payment_method: e.target.value })} className={inputClass} placeholder="e.g. Bank Transfer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Total Amount (IDR)</label>
                  <input type="number" value={editFormData.total_amount} onChange={e => setEditFormData({ ...editFormData, total_amount: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Progress (%)</label>
                  <input type="number" min={0} max={100} value={editFormData.progress} onChange={e => setEditFormData({ ...editFormData, progress: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Client Info</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Project / Logo Name</label>
                    <input type="text" value={editFormData.project_title} onChange={e => setEditFormData({ ...editFormData, project_title: e.target.value })} className={inputClass} placeholder="e.g. Logo Kopi Kenangan" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Customer Name</label>
                    <input type="text" value={editFormData.customer_name} onChange={e => setEditFormData({ ...editFormData, customer_name: e.target.value })} className={inputClass} placeholder="e.g. Budi Santoso" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Email</label>
                      <input type="email" value={editFormData.customer_email} onChange={e => setEditFormData({ ...editFormData, customer_email: e.target.value })} className={inputClass} placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">WhatsApp</label>
                      <input type="text" value={editFormData.whatsapp} onChange={e => setEditFormData({ ...editFormData, whatsapp: e.target.value })} className={inputClass} placeholder="+62 812..." />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Linked Item & Package</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Type</label>
                    <select value={editFormData.product_id ? "product" : editFormData.service_id ? "service" : "none"} onChange={e => {
                      const v = e.target.value;
                      if (v === "none") setEditFormData({...editFormData, service_id: "", product_id: "", selected_package: ""});
                      else if (v === "service") setEditFormData({...editFormData, service_id: servicesList[0]?.id || "", product_id: "", selected_package: ""});
                      else if (v === "product") setEditFormData({...editFormData, product_id: productsList[0]?.id || "", service_id: "", selected_package: ""});
                    }} className={inputClass}>
                      <option value="none">Custom (Manual Input)</option>
                      <option value="service">Service</option>
                      <option value="product">Shop Product</option>
                    </select>
                  </div>

                  {!editFormData.product_id && !editFormData.service_id && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Service / Item Name</label>
                        <input type="text" value={editFormData.custom_item_name || ""} onChange={e => setEditFormData({...editFormData, custom_item_name: e.target.value})} className={inputClass} placeholder="e.g. Logo Design" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Package Name</label>
                        <input type="text" value={editFormData.custom_package_name || ""} onChange={e => setEditFormData({...editFormData, custom_package_name: e.target.value})} className={inputClass} placeholder="e.g. Standard" />
                      </div>
                    </div>
                  )}

                  {(editFormData.product_id || editFormData.service_id) && (
                    <>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Item</label>
                        <select value={editFormData.product_id || editFormData.service_id} onChange={e => {
                          if (editFormData.product_id) setEditFormData({...editFormData, product_id: e.target.value, selected_package: ""});
                          else setEditFormData({...editFormData, service_id: e.target.value, selected_package: ""});
                        }} className={inputClass}>
                          {(editFormData.product_id ? productsList : servicesList).map((x: any) => (
                            <option key={x.id} value={x.id}>{x.title}</option>
                          ))}
                        </select>
                      </div>
                      {(() => {
                        let pkgs: any[] = [];
                        if (editFormData.product_id) {
                          const item = productsList.find((x: any) => x.id === editFormData.product_id);
                          try { pkgs = typeof item?.packages === "string" ? JSON.parse(item.packages) : (item?.packages || []); } catch { pkgs = []; }
                        } else {
                          const item = servicesList.find((x: any) => x.id === editFormData.service_id);
                          pkgs = item?.packages || [];
                        }
                        return pkgs.length > 0 ? (
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Package</label>
                            <select value={editFormData.selected_package || ""} onChange={e => {
                              const p = pkgs.find((x: any) => x.name === e.target.value);
                              if (p) setEditFormData((prev: any) => ({...prev, selected_package: p.name, total_amount: p.price || prev.total_amount}));
                            }} className={inputClass}>
                              <option value="">-- Choose Package --</option>
                              {pkgs.map((p: any) => (
                                <option key={p.name} value={p.name}>{p.name}{p.price ? ` — Rp${Number(p.price).toLocaleString("id-ID")}` : ""}</option>
                              ))}
                            </select>
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={updating} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Offline Project</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Manual order entry for offline clients</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Select Service <span className="text-red-500">*</span></label>
                <select required value={createFormData.service_id} onChange={e => setCreateFormData({ ...createFormData, service_id: e.target.value, selected_package: null, total_amount: "" })} className={inputClass}>
                  <option value="">-- Choose Service --</option>
                  {servicesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              {createFormData.service_id && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Select Package <span className="text-red-500">*</span></label>
                  <select required value={createFormData.selected_package?.name || ""} onChange={e => {
                    const service = servicesList.find(s => s.id === createFormData.service_id);
                    const pkg = service?.packages?.find((p: any) => p.name === e.target.value);
                    setCreateFormData({ ...createFormData, selected_package: pkg || null, total_amount: pkg ? String(pkg.price) : createFormData.total_amount });
                  }} className={inputClass}>
                    <option value="">-- Choose Package --</option>
                    {servicesList.find(s => s.id === createFormData.service_id)?.packages?.map((p: any) => (
                      <option key={p.name} value={p.name}>{p.name} — Rp{Number(p.price).toLocaleString("id-ID")}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Project / Logo Name <span className="text-red-500">*</span></label>
                <input required type="text" value={createFormData.title} onChange={e => setCreateFormData({ ...createFormData, title: e.target.value })} className={inputClass} placeholder="e.g. Logo Kopi Kenangan" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Client Name</label>
                <input type="text" value={createFormData.client_name} onChange={e => setCreateFormData({ ...createFormData, client_name: e.target.value })} className={inputClass} placeholder="e.g. Budi Santoso" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Total Amount (IDR) <span className="text-red-500">*</span></label>
                <input required type="number" value={createFormData.total_amount} onChange={e => setCreateFormData({ ...createFormData, total_amount: e.target.value })} className={inputClass} placeholder="150000" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Link to Registered User (Optional)</label>
                <select value={createFormData.user_id} onChange={e => setCreateFormData({ ...createFormData, user_id: e.target.value })} className={inputClass}>
                  <option value="">-- No Linked User --</option>
                  {usersList.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Initial Status</label>
                <select value={createFormData.status} onChange={e => setCreateFormData({ ...createFormData, status: e.target.value })} className={inputClass}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creatingProject} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {creatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
