"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, MessageCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export interface ChatAlert {
  id: string;
  senderName: string;
  message: string;
  link: string;
  avatarLetter: string;
  time: Date;
}

interface LiveChatContextType {
  chatHistory: ChatAlert[];
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export const LiveChatContext = createContext<LiveChatContextType | undefined>(undefined);

export const useLiveChat = () => {
  const context = useContext(LiveChatContext);
  if (!context) throw new Error("useLiveChat must be used within LiveChatPopupProvider");
  return context;
};

export function LiveChatPopupProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<ChatAlert[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatAlert[]>([]);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted || !user) return;

      const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      if (!isMounted) return;
      
      const role = profile?.is_admin ? 'admin' : 'user';

      channel = supabase.channel(`live_chat_alerts`);
      channel
        .on("broadcast", { event: "new_chat_alert" }, (payload: any) => {
          const alert = payload.payload;
          
          // Check if this alert is for me
          const isForMe = role === 'admin' ? alert.targetRole === 'admin' : alert.targetUserId === user.id;

          if (isForMe) {
            // Give them the popup unconditionally so they see it works
            const id = Math.random().toString(36).substring(2, 9);
            const newAlert: ChatAlert = {
              id,
              senderName: alert.senderName,
              message: alert.message,
              link: alert.link,
              avatarLetter: alert.senderName.charAt(0).toUpperCase(),
              time: new Date()
            };

            setAlerts(prev => {
              if (prev.some(a => a.message === alert.message && a.senderName === alert.senderName && (new Date().getTime() - a.time.getTime() < 2000))) {
                 return prev;
              }
              return [...prev, newAlert];
            });

            setChatHistory(prev => {
              if (prev.some(a => a.message === alert.message && a.senderName === alert.senderName && (new Date().getTime() - a.time.getTime() < 2000))) {
                 return prev;
              }
              return [newAlert, ...prev].slice(0, 20); // Keep last 20
            });

            // Play messenger type sound
            try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
                gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
              }
            } catch(e) {}

            // Auto remove after 5 seconds
            setTimeout(() => {
              removeAlert(id);
            }, 6000);
          }
        })
        .subscribe();
        
      if (!isMounted && channel) {
         supabase.removeChannel(channel);
      }
    };

    init();

    return () => { 
       isMounted = false;
       if (channel) {
          supabase.removeChannel(channel); 
       }
    };
  }, [removeAlert, supabase]); // Safe to add since supabase is memoized in createBrowserClient and removeAlert is useCallback

  const removeFromHistory = useCallback((id: string) => {
    setChatHistory(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  return (
    <LiveChatContext.Provider value={{ chatHistory, removeFromHistory, clearHistory }}>
      {children}
      {/* Facebook Messenger Style Chat Popups */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-4 pointer-events-none">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => {
              router.push(alert.link);
              removeAlert(alert.id);
            }}
            className="pointer-events-auto cursor-pointer flex items-start gap-4 p-4 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 bg-white w-[320px] animate-in slide-in-from-right fade-in duration-300 hover:scale-[1.02] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-600 shadow-md shadow-indigo-600/20 flex flex-shrink-0 items-center justify-center text-white font-black text-lg">
              {alert.avatarLetter}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-sm font-black text-slate-800 tracking-tight truncate">{alert.senderName}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-0.5 font-medium">{alert.message}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeAlert(alert.id);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 absolute top-2 right-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </LiveChatContext.Provider>
  );
}
