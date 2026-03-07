"use client";

import React, { useState } from "react";
import { Send, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTicketPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "technical", priority: "medium", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, subject: form.subject, category: form.category, priority: form.priority })
        .select().single();
      if (ticketError) throw ticketError;
      const { error: msgError } = await supabase
        .from("support_ticket_messages")
        .insert({ ticket_id: ticket.id, sender_id: user.id, content: form.message });
      if (msgError) throw msgError;
      supabase.channel("live_chat_alerts").send({
        type: "broadcast", event: "new_chat_alert",
        payload: { targetRole: "admin", senderName: user.user_metadata?.full_name || "User", message: `New Ticket: ${form.subject}`, link: `/dashboard/tickets/${ticket.id}` }
      });
      showToast("Ticket submitted successfully!", "success");
      router.push("/dashboard/tickets");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
          <Link href="/dashboard/tickets" className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Create New Ticket</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Submit a formal request for technical or billing support</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Ticket Details</h3>
            <p className="text-xs font-medium text-slate-500 mb-5 pb-4 border-b border-slate-100">Provide information about your issue so we can help quickly.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Subject</label>
                <input
                  required
                  type="text"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary of the issue..."
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none"
                >
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payment</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="other">General Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Message</h3>
            <p className="text-xs font-medium text-slate-500 mb-5 pb-4 border-b border-slate-100">Describe your issue in detail, including any steps to reproduce.</p>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">Your report will be reviewed by our team within 24 hours. Keep an eye on your dashboard for updates.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.subject || !form.message}
              className="bg-indigo-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
            <Link href="/dashboard/tickets" className="text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
