"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, LifeBuoy, Loader2, ArrowLeft, Calendar, Tag, Mail, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { format } from "date-fns";

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext(); const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.connect(g); g.connect(ctx.destination); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;

export default function AdminTicketChatClient({ ticket, user }: { ticket: any; user: any }) {
  const supabaseRef = useRef<any>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [status, setStatus] = useState(ticket.status || "open");
  const [clientProfile, setClientProfile] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      setIsInitializing(true);
      try {
        const sb = supabaseRef.current;
        const { data: msgs, error } = await sb.from("support_ticket_messages")
          .select("*, sender:users!sender_id (id, full_name, is_admin)")
          .eq("ticket_id", ticket.id).order("created_at", { ascending: true });
        if (error) throw error;
        setMessages(msgs || []);
        const { data: profile } = await sb.from("users").select("id, full_name, email").eq("id", ticket.user_id).maybeSingle();
        setClientProfile(profile);
      } catch (err: any) { showToast(err.message, "error"); }
      finally { setIsInitializing(false); }
    }
    init();
  }, [ticket.id]);

  useEffect(() => {
    if (!ticket?.id) return;
    const sb = supabaseRef.current;
    const ch = sb.channel(`ticket_room_${ticket.id}`);
    ch
      .on("broadcast", { event: "new_message" }, (payload: any) => {
        const msg = payload.payload;
        if (msg.sender_id === user.id) return;
        playNotificationSound();
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      })
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        setIsPartnerOnline(Object.values(state).some((p: any) => p.some((x: any) => x.user_id !== user.id)));
      })
      .subscribe(async (s: any) => { if (s === "SUBSCRIBED") await ch.track({ user_id: user.id }); });
    return () => { sb.removeChannel(ch); };
  }, [ticket.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;
    setLoading(true);
    try {
      const sb = supabaseRef.current;
      const { data: ins, error } = await sb.from("support_ticket_messages")
        .insert({ ticket_id: ticket.id, sender_id: user.id, content: newMessage.trim() }).select().single();
      if (error) throw error;
      if (status === "open") await updateStatus("in_progress");
      const msg = { ...ins, sender: { id: user.id, full_name: user?.user_metadata?.full_name || "Admin", is_admin: true } };
      setMessages(prev => prev.find(m => m.id === ins.id) ? prev : [...prev, msg]);
      setNewMessage("");
      sb.channel(`ticket_room_${ticket.id}`).send({ type: "broadcast", event: "new_message", payload: msg });
      sb.channel("live_chat_alerts").send({ type: "broadcast", event: "new_chat_alert", payload: { targetUserId: ticket.user_id, senderName: msg.sender.full_name, message: msg.content, link: `/dashboard/tickets/${ticket.id}` } });
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  };

  async function updateStatus(newStatus: string) {
    try {
      const { error } = await supabaseRef.current.from("support_tickets").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", ticket.id);
      if (error) throw error;
      setStatus(newStatus);
      showToast(`Status updated to ${newStatus.replace("_", " ")}`, "success");
    } catch (err: any) { showToast(err.message, "error"); }
  }

  const statusMap: Record<string, string> = { open: "bg-indigo-50 text-indigo-700", in_progress: "bg-amber-50 text-amber-700", resolved: "bg-emerald-50 text-emerald-700", closed: "bg-slate-100 text-slate-500" };

  return (
    <div className="pt-6 px-4 pb-4 xl:grid xl:grid-cols-3 xl:gap-6 gap-4 flex flex-col h-[calc(100vh-80px)]">

      <div className="xl:col-span-2 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <Link href="/dashboard/tickets" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Tickets
          </Link>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Status</label>
            <select
              value={status}
              onChange={e => updateStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-3 py-2 transition-all outline-none"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3" ref={scrollRef}>
          {isInitializing ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600 opacity-30" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40 gap-3">
              <p className="text-xs font-bold uppercase tracking-wider">No messages yet</p>
            </div>
          ) : messages.map((m, idx) => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id || idx} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 self-end">
                  {isMe ? "A" : clientProfile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed rounded-2xl ${isMe ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {m.content}
                  </div>
                  <span className="text-[10px] font-medium text-slate-300 px-1">
                    {!isMe && <span className="mr-1">{m.sender?.full_name ?? "Client"} ·</span>}
                    {m.created_at ? format(new Date(m.created_at), "HH:mm") : "--:--"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Reply to the client..."
              className="flex-1 bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none"
            />
            <button type="submit" disabled={loading || !newMessage.trim()} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      <div className="xl:col-span-1 flex flex-col gap-4 shrink-0">
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-3 border-b border-slate-100">Ticket Info</p>
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 mx-auto">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">#{ticket.id.slice(0, 8)}</p>
          <p className="text-sm font-bold text-slate-800 text-center mt-1 mb-3">{ticket.subject}</p>
          <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg block text-center w-fit mx-auto mb-4 ${statusMap[status] || "bg-slate-100 text-slate-500"}`}>
            {status?.replace("_", " ")}
          </span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-medium text-slate-600">{ticket.category}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-medium text-slate-600">{format(new Date(ticket.created_at), "dd MMM yyyy")}</span>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-3 border-b border-slate-100">Client</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
              {clientProfile?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{clientProfile?.full_name || "Unknown"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                <span className={`text-xs font-bold ${isPartnerOnline ? "text-emerald-600" : "text-slate-400"}`}>
                  {isPartnerOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-600 truncate">{clientProfile?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
