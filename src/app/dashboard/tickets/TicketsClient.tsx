"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LifeBuoy, Plus, RefreshCcw, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { format } from "date-fns";

export default function TicketsClient({ initialUser }: { initialUser: any }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", initialUser.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [initialUser.id, supabase, showToast]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Tickets</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">View and manage your support requests</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
            <Link
              href="/dashboard/tickets/new"
              className="bg-indigo-600 text-sm font-bold text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Ticket
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 opacity-30" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LifeBuoy className="w-10 h-10 mb-3 opacity-20" strokeWidth={1.5} />
            <p className="text-xs font-bold uppercase tracking-wider mb-1">No tickets yet</p>
            <p className="text-xs font-medium text-slate-400">Create a ticket to reach our support team.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Ticket ID</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Subject</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/tickets/${t.id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                        #{t.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{t.subject}</p>
                      <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase">Priority: {t.priority}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">{t.category}</span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-medium text-slate-400">{format(new Date(t.created_at), "dd MMM yyyy")}</span>
                        <Link href={`/dashboard/tickets/${t.id}`} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
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
