"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft, Mail, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

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

export default function AdminChatRoomClient({ roomId, user }: { roomId: string; user: any }) {
  const supabaseRef = useRef<any>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [chat, setChat] = useState<any>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = supabaseRef.current;
    async function init() {
      setIsInitializing(true);
      try {
        const { data: chatRoom, error: ce } = await sb.from("admin_chats").select("*").eq("id", roomId).single();
        if (ce) throw ce;
        const { data: up } = await sb.from("users").select("id, full_name, email, is_admin").eq("id", chatRoom.user_id).maybeSingle();
        setChat({ ...chatRoom, user: up ?? null });
        const { data: msgs, error: me } = await sb.from("admin_chat_messages").select("*").eq("chat_id", roomId).order("created_at", { ascending: true });
        if (me) throw me;
        const ids = [...new Set((msgs ?? []).map((m: any) => m.sender_id))];
        const pm: Record<string, any> = {};
        if (ids.length > 0) {
          const { data: ps } = await sb.from("users").select("id, full_name, is_admin").in("id", ids);
          (ps ?? []).forEach((p: any) => { pm[p.id] = p; });
        }
        setMessages((msgs ?? []).map((m: any) => ({ ...m, sender: pm[m.sender_id] ?? null })));
        if (chatRoom.user_id) await sb.from("admin_chat_messages").update({ is_read: true }).eq("chat_id", roomId).eq("sender_id", chatRoom.user_id).eq("is_read", false);
      } catch (err: any) { showToast(err.message || "Failed to load chat", "error"); }
      finally { setIsInitializing(false); }
    }
    init();
  }, [roomId]); // eslint-disable-line

  useEffect(() => {
    if (!chat?.id) return;
    const sb = supabaseRef.current;
    const ch = sb.channel(`admin_direct_room_${chat.id}`);
    ch
      .on("broadcast", { event: "new_message" }, async (payload: any) => {
        const msg = payload.payload;
        if (msg.sender_id === user.id) return;
        playNotificationSound();
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        await sb.from("admin_chat_messages").update({ is_read: true }).eq("id", msg.id);
      })
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        setIsPartnerOnline(Object.values(state).some((p: any) => p.some((x: any) => x.user_id !== user.id)));
      })
      .subscribe(async (s: any) => { if (s === "SUBSCRIBED") await ch.track({ user_id: user.id }); });
    return () => { sb.removeChannel(ch); };
  }, [chat?.id]); // eslint-disable-line

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !chat) return;
    setLoading(true);
    try {
      const sb = supabaseRef.current;
      const { data: ins, error } = await sb.from("admin_chat_messages").insert({ chat_id: chat.id, sender_id: user.id, content: newMessage.trim() }).select().single();
      if (error) throw error;
      const msg = { ...ins, sender: { id: user.id, full_name: user?.user_metadata?.full_name || "Admin", is_admin: true } };
      setMessages(prev => prev.find(m => m.id === ins.id) ? prev : [...prev, msg]);
      sb.channel(`admin_direct_room_${chat.id}`).send({ type: "broadcast", event: "new_message", payload: msg });
      sb.channel("live_chat_alerts").send({ type: "broadcast", event: "new_chat_alert", payload: { targetUserId: chat.user_id, senderName: msg.sender.full_name, message: msg.content, link: `/dashboard/chat` } });
      await sb.from("admin_chats").update({ last_message_at: new Date().toISOString() }).eq("id", chat.id);
      setNewMessage("");
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  };

  if (isInitializing) {
    return <div className="pt-6 px-4 flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 opacity-30" /></div>;
  }

  return (
    <div className="pt-6 px-4 pb-4 xl:grid xl:grid-cols-3 xl:gap-6 gap-4 flex flex-col h-[calc(100vh-80px)]">

      <div className="xl:col-span-2 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 xl:order-none order-last">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <Link href="/dashboard/chat" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Chats
          </Link>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{messages.length} messages</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40 gap-3">
              <p className="text-xs font-bold uppercase tracking-wider">No messages yet — start the conversation</p>
            </div>
          ) : messages.map((m, idx) => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id ?? idx} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 self-end">
                  {isMe ? "A" : chat?.user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed rounded-2xl ${isMe ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {m.content}
                  </div>
                  <span className="text-[10px] font-medium text-slate-300 px-1">
                    {m.created_at ? format(new Date(m.created_at), "HH:mm") : "--:--"}
                    {isMe && m.is_read && " · Read"}
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
              placeholder="Reply to client..."
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Client Profile</p>
          <div className="flex flex-col items-center text-center gap-2 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg overflow-hidden">
              {chat?.user?.avatar_url
                ? <img src={chat.user.avatar_url} alt="" className="w-full h-full object-cover" />
                : chat?.user?.full_name?.charAt(0)?.toUpperCase() || "?"
              }
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{chat?.user?.full_name ?? "Unknown"}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isPartnerOnline ? "text-emerald-600" : "text-slate-400"}`}>
                  {isPartnerOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-medium truncate">{chat?.user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-medium">Last active {formatDistanceToNow(new Date(chat?.last_message_at || Date.now()), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
