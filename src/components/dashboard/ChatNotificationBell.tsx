"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Check, Trash2 } from "lucide-react";
import { useLiveChat } from "@/components/providers/LiveChatPopupProvider";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface ChatNotif {
  id: string;
  senderName: string;
  message: string;
  time: string;
  link: string;
  type: "live" | "support" | "workspace";
  avatarLetter: string;
}

export default function ChatNotificationBell({ role = "user", userId }: { role?: "admin" | "user", userId?: string }) {
  const { chatHistory: liveChatHistory, removeFromHistory, clearHistory: clearLiveHistory } = useLiveChat();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [dbChats, setDbChats] = useState<ChatNotif[]>([]);

  const fetchDbChats = useCallback(async () => {
    if (!userId) return;

    try {
      // 1. Support Tickets
      const { data: supportMsgs } = await supabase
        .from("support_ticket_messages")
        .select("id, content, created_at, ticket_id, support_tickets(subject), users(full_name, email)")
        .eq("is_read", false)
        .neq("sender_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      // 2. Workspace
      const { data: workspaceMsgs } = await supabase
        .from("store_messages")
        .select("id, content, created_at, workspace_id, store_workspaces(store_orders(order_number)), users(full_name, email)")
        .eq("is_read", false)
        .neq("sender_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      // We don't query admin_chat_messages here if live chat uses its own system, 
      // but if we did, we'd add it here. For now, we assume useLiveChat handles live chats.

      const parsed: ChatNotif[] = [];
      
      if (supportMsgs) {
        supportMsgs.forEach((msg: any) => {
          parsed.push({
            id: `support_${msg.id}`,
            senderName: msg.users?.full_name || msg.users?.email || "User",
            message: msg.content,
            time: msg.created_at,
            link: role === "admin" ? `/dashboard/tickets/${msg.ticket_id}` : `/dashboard/tickets/${msg.ticket_id}`,
            type: "support",
            avatarLetter: (msg.users?.full_name || msg.users?.email || "U").charAt(0).toUpperCase()
          });
        });
      }

      if (workspaceMsgs) {
        workspaceMsgs.forEach((msg: any) => {
          parsed.push({
            id: `ws_${msg.id}`,
            senderName: msg.users?.full_name || msg.users?.email || "User",
            message: msg.content,
            time: msg.created_at,
            link: role === "admin" ? `/dashboard/projects/${msg.store_workspaces?.store_orders?.order_number || ''}/workspace` : `/dashboard/projects/${msg.store_workspaces?.store_orders?.order_number || ''}/workspace`,
            type: "workspace",
            avatarLetter: (msg.users?.full_name || msg.users?.email || "W").charAt(0).toUpperCase()
          });
        });
      }

      setDbChats(parsed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    } catch (e) {
      console.error(e);
    }
  }, [userId, role, supabase]);

  useEffect(() => {
    fetchDbChats();
    // Subscribe to all 3 tables
    const ch = supabase.channel('chat-bell-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_ticket_messages' }, () => fetchDbChats())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_ticket_messages' }, () => fetchDbChats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'store_messages' }, () => fetchDbChats())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_messages' }, () => fetchDbChats())
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    }
  }, [fetchDbChats, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge live chats and DB chats
  const liveChatsAsNotifs: ChatNotif[] = liveChatHistory.map(l => ({
    id: `live_${l.id}`,
    senderName: l.senderName,
    message: l.message,
    time: l.time,
    link: l.link,
    type: "live",
    avatarLetter: l.avatarLetter
  }));

  const allChats = [...liveChatsAsNotifs, ...dbChats].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const unreadCount = allChats.length;

  const handleMarkAsRead = async (chat: ChatNotif) => {
    if (chat.type === "live") {
      removeFromHistory(chat.id.replace("live_", ""));
    } else if (chat.type === "support") {
      await supabase.from("support_ticket_messages").update({ is_read: true }).eq("id", chat.id.replace("support_", ""));
      setDbChats(dbChats.filter(c => c.id !== chat.id));
    } else if (chat.type === "workspace") {
      await supabase.from("store_messages").update({ is_read: true }).eq("id", chat.id.replace("ws_", ""));
      setDbChats(dbChats.filter(c => c.id !== chat.id));
    }
  };

  const clearAll = async () => {
    clearLiveHistory();
    setIsOpen(false);
    if (!userId) return;

    // Mark all as read for support & workspace
    // Simplest way: loop and update (since we want to avoid complex multi-table update queries)
    const supportIds = dbChats.filter(c => c.type === 'support').map(c => c.id.replace('support_', ''));
    if (supportIds.length > 0) {
      await supabase.from('support_ticket_messages').update({ is_read: true }).in('id', supportIds);
    }

    const wsIds = dbChats.filter(c => c.type === 'workspace').map(c => c.id.replace('ws_', ''));
    if (wsIds.length > 0) {
      await supabase.from('store_messages').update({ is_read: true }).in('id', wsIds);
    }
    
    setDbChats([]);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-slate-500 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-xl mr-1 relative transition-colors ${isOpen ? "bg-slate-50 text-indigo-600" : ""}`}
      >
        <MessageCircle className={`w-5 h-5 ${unreadCount > 0 ? "text-indigo-600" : ""}`} fill={unreadCount > 0 ? "currentColor" : "none"} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 ring-2 ring-white bg-rose-500" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-lg ring-1 ring-slate-100 overflow-hidden origin-top-right z-50">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Chat Messages</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{unreadCount} unread message(s)</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                title="Mark all as read"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {allChats.length > 0 ? (
              allChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setIsOpen(false)}
                  className="flex gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group relative bg-white"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r" />
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm ${
                    chat.type === 'support' ? 'bg-orange-50 text-orange-600' :
                    chat.type === 'workspace' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {chat.avatarLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate pr-2">{chat.senderName}</p>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                        {chat.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{chat.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(chat.time), "HH:mm")} · {format(new Date(chat.time), "dd MMM")}
                      </span>
                      {chat.link && (
                        <Link href={chat.link} className="text-[10px] font-bold text-indigo-600 hover:underline">
                          Reply
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(chat); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-slate-500 transition-all self-start mt-0.5"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                <MessageCircle className="w-8 h-8 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Inbox Zero</p>
              </div>
            )}
          </div>

          {allChats.length > 0 && (
            <div className="py-3 text-center bg-slate-50 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                — End of chat messages —
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
