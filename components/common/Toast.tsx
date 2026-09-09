"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastContextValue {
  notify: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const notify = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    window.setTimeout(() => setVisible(false), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-xl transition-all duration-300"
        style={{
          background: "#0F172A",
          transform: visible ? "translateY(0)" : "translateY(12px)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <CheckCircle2 size={16} className="text-green-400 shrink-0" />
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
