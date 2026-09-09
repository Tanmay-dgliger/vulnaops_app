"use client";

import { useEffect, useState } from "react";
import { Database, Layers, GitMerge, Shield, CheckCircle2, Check } from "lucide-react";

const PIPELINE = [
  { id: "ingest", label: "Records Received", sublabel: "Parsing scan file", icon: <Database size={16} />, color: "#2563EB", duration: 700 },
  { id: "normalize", label: "Normalization", sublabel: "Standardizing CVE IDs, severities, hostnames", icon: <Layers size={16} />, color: "#7C3AED", duration: 900 },
  { id: "dedup", label: "Duplicate Detection", sublabel: "Cross-referencing existing findings by CVE + asset + port", icon: <GitMerge size={16} />, color: "#D97706", duration: 900 },
  { id: "classify", label: "Risk Classification", sublabel: "CVSS, EPSS, exploit availability, business context", icon: <Shield size={16} />, color: "#EA580C", duration: 700 },
  { id: "commit", label: "Committed to Database", sublabel: "New findings added to vulnerability queue", icon: <CheckCircle2 size={16} />, color: "#16A34A", duration: 500 },
];

export default function ImportProcessingOverlay({ scanner, file, onComplete }: { scanner: string; file: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let step = 0;
    const timers: number[] = [];
    const advance = () => {
      if (step >= PIPELINE.length) {
        setDone(true);
        timers.push(window.setTimeout(onComplete, 700));
        return;
      }
      setCurrentStep(step);
      timers.push(window.setTimeout(() => { step += 1; advance(); }, PIPELINE[step].duration));
    };
    advance();
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallPct = Math.round(((done ? PIPELINE.length : currentStep) / PIPELINE.length) * 100);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-xl" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 font-heading">Import Processing</h2>
          <p className="text-xs text-slate-500 mt-0.5">{file} · {scanner}</p>
        </div>
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {done ? <CheckCircle2 size={16} className="text-green-500" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
              <span className="text-sm font-semibold text-slate-900">{done ? "Import Complete" : "Processing…"}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: done ? "#16A34A" : "#2563EB" }}>{overallPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}><div className="h-full rounded-full transition-all duration-300" style={{ width: `${overallPct}%`, background: done ? "#16A34A" : "#2563EB" }} /></div>
        </div>
        <div className="space-y-2">
          {PIPELINE.map((step, i) => {
            const isDone = i < currentStep || done;
            const isActive = i === currentStep && !done;
            return (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: isDone ? `${step.color}0D` : "#FAFBFC", border: `1px solid ${isDone || isActive ? step.color + "33" : "#E2E8F0"}`, opacity: !isDone && !isActive ? 0.5 : 1 }}>
                <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 30, height: 30, background: isDone ? step.color : "#F1F5F9", color: isDone ? "#FFFFFF" : "#94A3B8" }}>
                  {isDone ? <Check size={14} strokeWidth={3} /> : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: isDone || isActive ? "#0F172A" : "#94A3B8" }}>{step.label}</div>
                  <div className="text-[10px] text-slate-400">{step.sublabel}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
