"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Database, Layers, GitMerge, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { formatDate } from "@/lib/business/format";

export default function ImportDetail({ id }: { id: string }) {
  const router = useRouter();
  const { scannerImports } = useData();
  const rec = scannerImports.find((r) => r.id === id);

  if (!rec) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Import not found.</p></div>;
  }

  const PIPELINE = [
    { label: "Records Received", desc: "Raw scan data ingested from source file", count: `${rec.records.toLocaleString()} records`, icon: <Database size={16} /> },
    { label: "Normalization", desc: "CVE IDs, severity scores, and asset names standardized", count: `${(rec.records - rec.invalid).toLocaleString()} normalized`, icon: <Layers size={16} /> },
    { label: "Duplicate Detection", desc: "Cross-referenced using CVE, asset, and port matching", count: `${rec.duplicates.toLocaleString()} matched`, icon: <GitMerge size={16} /> },
    { label: "Risk Classification", desc: "CVSS scoring, exploit availability, and business context applied", count: `${(rec.newFindings + rec.updated).toLocaleString()} scored`, icon: <Shield size={16} /> },
    { label: "Valid Records Imported", desc: "Clean findings committed to the vulnerability database", count: `${(rec.records - rec.invalid).toLocaleString()} imported`, icon: <CheckCircle2 size={16} /> },
  ];
  const breakdown = [
    { label: "New Findings", val: rec.newFindings, color: "#2563EB", bg: "#EFF6FF" },
    { label: "Duplicates", val: rec.duplicates, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Updated", val: rec.updated, color: "#D97706", bg: "#FFFBEB" },
    { label: "Invalid", val: rec.invalid, color: "#DC2626", bg: "#FEF2F2" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <button onClick={() => router.push("/scanner-imports")} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={13} /> Back to Imports</button>

      <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>{rec.scanner}</span>
              <span className="font-mono text-sm font-semibold text-slate-900">{rec.file}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: "#F0FDF4", color: "#16A34A" }}><CheckCircle2 size={12} /> {rec.status}</span>
            </div>
            <p className="text-xs text-slate-500">{formatDate(rec.date)} · Processing time: {rec.duration} · Import ID: {rec.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          {breakdown.map((b) => (
            <div key={b.label} className="rounded-lg p-3" style={{ background: b.bg, border: `1px solid ${b.color}22` }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: b.color }}>{b.label}</div>
              <div className="text-2xl font-bold text-slate-900 font-heading">{b.val.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{((b.val / rec.records) * 100).toFixed(1)}% of total</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
          <h3 className="text-sm font-semibold text-slate-900">Import Processing Pipeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">End-to-end transformation from raw scan output to normalized findings</p>
        </div>
        <div className="p-6 space-y-3">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <div className="text-[11px] font-bold text-slate-400 tabular-nums w-4 shrink-0">{i + 1}</div>
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 32, height: 32, background: "#EFF6FF", color: "#2563EB" }}>{step.icon}</div>
              <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-slate-900">{step.label}</div><div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div></div>
              <div className="text-right shrink-0"><div className="text-sm font-bold text-slate-900">{step.count}</div></div>
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {rec.invalid > 0 && (
        <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FFFBEB" }}><AlertTriangle size={15} className="text-amber-500" /><h3 className="text-sm font-semibold text-amber-800">Invalid Records ({rec.invalid})</h3></div>
          <div className="p-5 text-xs text-slate-500">Records rejected due to invalid CVE format, missing asset hostname, or duplicate scanner IDs. Full detail available in the import log export.</div>
        </div>
      )}
      <div className="h-4" />
    </div>
  );
}
