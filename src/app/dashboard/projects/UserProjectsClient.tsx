"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Package, Briefcase, Loader2, RefreshCcw,
  MessageSquare, Eye, X, CreditCard, Upload, Download,
  AlertCircle, FileCheck, ShieldCheck, Hash, Calendar, Wallet
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  product_id?: string;
  service_id?: string;
  payment_proof?: string;
  delivery_file?: string;
  selected_package?: any;
  store_products?: { title: string };
  store_services?: { title: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  waiting_payment: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-indigo-50 text-indigo-700 border-indigo-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  revision: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function UserProjectsClient({ userId }: { userId: string }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Order | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [savingProof, setSavingProof] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_orders")
      .select("*, store_products(title), store_services(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) showToast(error.message, "error");
    else setOrders((data as Order[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = (o: Order) => {
    setSelected(o);
    setPaymentProofUrl(o.payment_proof || "");
  };

  const closeDetail = () => { setSelected(null); setPaymentProofUrl(""); };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (!file.type.startsWith("image/")) return showToast("Upload an image file for payment proof.", "error");
    setUploadingProof(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `payment-proofs/proof-${selected.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(path);
      setPaymentProofUrl(publicUrl);
      showToast("Proof uploaded!", "success");
    } catch (err: any) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!paymentProofUrl || !selected) return;
    setSavingProof(true);
    const { error } = await supabase.from("store_orders").update({
      payment_proof: paymentProofUrl,
      status: "waiting_payment",
    }).eq("id", selected.id);
    if (error) showToast(error.message, "error");
    else {
      showToast("Payment proof submitted! Waiting for admin confirmation.", "success");
      setSelected(prev => prev ? { ...prev, status: "waiting_payment", payment_proof: paymentProofUrl } : null);
      fetchOrders();
    }
    setSavingProof(false);
  };

  const filtered = orders.filter(o => {
    const title = o.store_products?.title || o.store_services?.title || "";
    return o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase());
  });

  const getProjectTitle = (o: Order) =>
    o.store_products?.title || o.store_services?.title || "Project";

  const getPkgName = (o: Order) => {
    try {
      const pkg = typeof o.selected_package === "string" ? JSON.parse(o.selected_package) : o.selected_package;
      return pkg?.name || "";
    } catch { return ""; }
  };

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Projects</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track your active commissions and service delivery.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <Link href="/services"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors">
            Browse Services
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID or title..."
              className="w-full bg-slate-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Briefcase className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">No projects yet</p>
            <p className="text-xs mt-1">Place an order from our Services or Shop to get started</p>
            <Link href="/services" className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Browse Services →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Order Ref</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">#{o.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                          {o.service_id ? <Briefcase className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{getProjectTitle(o)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">Rp {Number(o.total_amount || 0).toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${STATUS_COLORS[o.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(o)}
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
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Order Detail</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">#{selected.order_number}</p>
              </div>
              <button onClick={closeDetail} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project</p>
                  <p className="text-sm font-bold text-slate-900">{getProjectTitle(selected)}</p>
                  {getPkgName(selected) && <p className="text-xs text-slate-500 mt-0.5">{getPkgName(selected)}</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block ${STATUS_COLORS[selected.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    {selected.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Amount</p>
                  <p className="text-sm font-bold text-slate-900">Rp {Number(selected.total_amount || 0).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-xs text-slate-500 break-all">{selected.id}</span>
              </div>

              {/* UPLOAD BUKTI BAYAR */}
              {(selected.status === "pending" || selected.status === "waiting_payment") && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Proof</p>
                  {selected.status === "waiting_payment" && selected.payment_proof ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-amber-700">Proof submitted. Waiting for admin confirmation.</p>
                      <a href={selected.payment_proof} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-600 underline mt-1 block">View uploaded proof</a>
                    </div>
                  ) : (
                    <>
                      {paymentProofUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32">
                          <img src={paymentProofUrl} alt="Payment proof" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPaymentProofUrl("")} className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-lg text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={handleUploadProof} disabled={uploadingProof} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-pointer">
                          {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span className="text-xs font-bold">{uploadingProof ? "Uploading..." : "Upload Transfer Proof"}</span>
                        </div>
                      </div>
                      {paymentProofUrl && (
                        <button type="button" onClick={handleSubmitProof} disabled={savingProof}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                          {savingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Submit Payment Proof</>}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* DOWNLOAD FILE AKHIR (Shop, completed, ada delivery_file) */}
              {selected.product_id && selected.status === "completed" && selected.delivery_file && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your File is Ready</p>
                  <a
                    href={selected.delivery_file}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Result File
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <Link href={`/workspace/${selected.id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                <MessageSquare className="w-4 h-4" /> Open Workspace
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
