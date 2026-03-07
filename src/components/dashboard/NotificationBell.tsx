"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Loader2, Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

interface Notification {
  id: string;
  user_id: string | null;
  role: string | null;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell({ role }: { role: "admin" | "user" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const bellRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | undefined;

    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetchNotifications();

      sub = supabase
        .channel("db-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            const newNotif = payload.new as Notification;

          const isForMe =
            role === "admin"
              ? newNotif.role === "admin"
              : newNotif.role === "user" && (!newNotif.user_id || newNotif.user_id === user.id);

          if (isForMe) {
            fetchNotifications();

            const currentPath = window.location.pathname;
            if (newNotif.link && !currentPath.includes(newNotif.link)) {
              showToast(newNotif.title, newNotif.type === "success" ? "success" : newNotif.type === "error" ? "error" : "info");

              try {
                const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
                if (AudioContext) {
                  const ctx = new AudioContext();
                  const osc = ctx.createOscillator();
                  const gainNode = ctx.createGain();
                  osc.type = "sine";
                  osc.frequency.setValueAtTime(800, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                  gainNode.gain.setValueAtTime(0, ctx.currentTime);
                  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                  osc.connect(gainNode);
                  gainNode.connect(ctx.destination);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.15);
                }
              } catch {}
            }
          }
        })
        .subscribe();
    };

    initNotifications();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (role === "admin") {
      query = query.eq("role", "admin");
    } else {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;
    let fetchedNotifs = (data as Notification[]) || [];

    // Check user profile for missing info natively
    if (role === "user") {
      const { data: userData } = await supabase.from("users").select("company, location").eq("id", user.id).single();
      if (userData) {
        if (!userData.company || userData.company === "Unknown Company" || !userData.location || userData.location === "Indonesia") {
          const profileWarning: Notification = {
            id: "profile-warning-local",
            user_id: user.id,
            role: "user",
            title: "Complete Your Profile",
            message: "Missing Company/Organization and Location. Please update them.",
            type: "warning",
            link: "/dashboard/settings",
            is_read: false,
            created_at: new Date().toISOString(),
          };
          fetchedNotifs = [profileWarning, ...fetchedNotifs];
        }
      }
    }

    setNotifications(fetchedNotifs);
    setUnreadCount(fetchedNotifs.filter((n) => !n.is_read).length);
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase.from("notifications").update({ is_read: true });

      if (role === "admin") {
        query = query.eq("role", "admin").eq("is_read", false);
      } else {
        query = query.eq("user_id", user?.id).eq("is_read", false);
      }

      await query;
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (id !== "profile-warning-local") {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id !== "profile-warning-local") {
      await supabase.from("notifications").delete().eq("id", id);
    }
    setNotifications(notifications.filter((n) => n.id !== id));
    if (notifications.find((n) => n.id === id && !n.is_read)) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const typeStyles: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    info: { icon: <Info className="w-4 h-4" />, bg: "bg-blue-50", text: "text-blue-500" },
    success: { icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-emerald-50", text: "text-emerald-500" },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: "bg-orange-50", text: "text-orange-500" },
    danger: { icon: <XCircle className="w-4 h-4" />, bg: "bg-red-50", text: "text-red-500" },
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-slate-500 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-xl mr-1 relative transition-colors ${isOpen ? "bg-slate-50 text-indigo-600" : ""}`}
      >
        <Bell className="w-5 h-5" />
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
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                title="Mark all as read"
                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!n.is_read ? "bg-indigo-50/30" : ""}`}
                >
                  {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r" />}
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${typeStyles[n.type]?.bg || "bg-slate-50"} ${typeStyles[n.type]?.text || "text-slate-400"}`}>
                    {typeStyles[n.type]?.icon || <Info className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400">{formatTime(n.created_at)}</span>
                      {n.link && (
                        <Link href={n.link} className="text-[10px] font-bold text-indigo-600 hover:underline">
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all self-start mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">All clear</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="py-3 text-center bg-slate-50 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">— End of notifications —</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
