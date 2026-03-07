"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LifeBuoy, Search, Loader2, ArrowRight, Calendar, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminTicketsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`*, user:users!user_id (full_name, email, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Support Tickets</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Review and manage all client support requests</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ticket or client..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pl-10 pr-4 py-2.5 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 opacity-30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LifeBuoy className="w-10 h-10 mb-3 opacity-20" strokeWidth={1.5} />
            <p className="text-xs font-bold uppercase tracking-wider">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Client</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Subject</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Priority</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 overflow-hidden">
                          {t.user?.avatar_url
                            ? <img src={t.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            : t.user?.full_name?.charAt(0).toUpperCase() || "?"
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{t.user?.full_name || "Unknown"}</p>
                          <p className="text-xs font-medium text-slate-400">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 line-clamp-1">{t.subject}</p>
                      <p className="text-xs font-medium text-slate-400">#{t.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg inline-block ${
                        t.priority === "urgent" ? "bg-red-50 text-red-600" :
                        t.priority === "high" ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>{t.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium">{format(new Date(t.created_at), "dd MMM yyyy")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/tickets/${t.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors">
                        Manage <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-indigo-50 text-indigo-700",
    in_progress: "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-500"
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase inline-block ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}
