"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, Loader2, Users, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AdminChatListClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_chats")
        .select(`*, user:users!user_id (id, full_name, email, avatar_url)`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const enriched = await Promise.all(
        (data || []).map(async (chat) => {
          const { count } = await supabase.from("admin_chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chat.id).eq("is_read", false);
          return { ...chat, unread_count: count || 0 };
        })
      );
      setChats(enriched);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const filtered = chats.filter(c =>
    c.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-6 px-4 pb-10 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Live Chat</h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">{chats.length} active conversation{chats.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client..."
            className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pl-10 pr-4 py-2.5 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 opacity-30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="w-10 h-10 mb-3 opacity-20" strokeWidth={1.5} />
          <p className="text-xs font-bold uppercase tracking-wider">No active conversations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(chat => (
            <Link
              key={chat.id}
              href={`/dashboard/chat/${chat.id}`}
              className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-5 hover:ring-indigo-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 overflow-hidden">
                    {chat.user?.avatar_url
                      ? <img src={chat.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      : chat.user?.full_name?.charAt(0).toUpperCase() || "?"
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{chat.user?.full_name || "Unknown"}</p>
                    <p className="text-xs font-medium text-slate-400 truncate max-w-[120px]">{chat.user?.email}</p>
                  </div>
                </div>
                {chat.unread_count > 0 && (
                  <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {chat.unread_count}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
