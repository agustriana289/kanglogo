"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 w-80 p-4 rounded-xl shadow-xl ring-1 pointer-events-auto backdrop-blur-md ${
                toast.type === "success" 
                  ? "bg-emerald-500/90 text-white ring-emerald-600/50" 
                  : toast.type === "error"
                  ? "bg-rose-500/90 text-white ring-rose-600/50"
                  : "bg-slate-900/90 text-white ring-slate-800/50"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
                {toast.type === "info" && <Info className="w-5 h-5" />}
              </div>
              <p className="flex-1 text-sm font-semibold leading-relaxed">
                {toast.message}
              </p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
