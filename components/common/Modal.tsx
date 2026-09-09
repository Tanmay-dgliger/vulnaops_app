"use client";

import { X } from "lucide-react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({ title, subtitle, onClose, children, width = 440 }: ModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-2xl overflow-hidden pointer-events-auto"
          style={{ width, maxWidth: "calc(100vw - 32px)", background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100" style={{ width: 32, height: 32 }} aria-label="Close">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  );
}
