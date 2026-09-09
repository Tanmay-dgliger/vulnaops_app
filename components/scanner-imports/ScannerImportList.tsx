"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, ChevronRight, CheckCircle2, RefreshCw, X, Clock } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { formatDate } from "@/lib/business/format";
import ImportProcessingOverlay from "./ImportProcessingOverlay";

const SCANNER_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Qualys: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Nessus: { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  Rapid7: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  Tenable: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
};
const STATUS_CFG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Processed: { bg: "#F0FDF4", text: "#16A34A", icon: <CheckCircle2 size={12} /> },
  Processing: { bg: "#EFF6FF", text: "#2563EB", icon: <RefreshCw size={12} className="animate-spin" /> },
  Failed: { bg: "#FEF2F2", text: "#DC2626", icon: <X size={12} /> },
  Queued: { bg: "#F8FAFC", text: "#64748B", icon: <Clock size={12} /> },
};

export default function ScannerImportList() {
  const router = useRouter();
  const { scannerImports, importScan } = useData();
  const [showUpload, setShowUpload] = useState(false);
  const [processing, setProcessing] = useState<{ scanner: string; file: string } | null>(null);

  const startImport = (scanner: string) => {
    const file = `${scanner.toLowerCase()}_0910.xlsx`;
    setShowUpload(false);
    setProcessing({ scanner, file });
  };

  const finishImport = () => {
    if (!processing) return;
    const record = importScan(processing.scanner, processing.file);
    setProcessing(null);
    router.push(`/scanner-imports/${record.id}`);
  };

  const processedTotal = scannerImports.filter((r) => r.status === "Processed").reduce((s, r) => s + r.records, 0);
  const newFindingsTotal = scannerImports.filter((r) => r.status === "Processed").reduce((s, r) => s + r.newFindings, 0);
  const dedupTotal = scannerImports.filter((r) => r.status === "Processed").reduce((s, r) => s + r.duplicates, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Scanner Imports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Import and normalize findings from existing vulnerability scanners</p>
        </div>
        <button onClick={() => setShowUpload((v) => !v)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
          <Upload size={14} /> Import Scan
        </button>
      </div>

      {showUpload && (
        <div className="rounded-xl border-2 border-dashed p-8 text-center transition-all" style={{ borderColor: "#BFDBFE", background: "#F8FAFC" }}>
          <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-3" style={{ background: "#EFF6FF" }}><Upload size={22} className="text-blue-500" /></div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Select scanner to simulate import</h3>
          <p className="text-xs text-slate-400 mb-3">Supports Qualys, Nessus, Tenable, and Rapid7 exports (.xlsx, .csv, .xml)</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {["Qualys", "Nessus", "Tenable", "Rapid7"].map((s) => {
              const sc = SCANNER_COLOR[s];
              return (
                <button key={s} onClick={() => startImport(s)} className="flex items-center gap-1.5 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                  <FileText size={12} /> {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Imports", val: scannerImports.length, color: "#0F172A", bg: "#F8FAFC" },
          { label: "Records Processed", val: processedTotal.toLocaleString(), color: "#2563EB", bg: "#EFF6FF" },
          { label: "New Findings", val: newFindingsTotal.toLocaleString(), color: "#DC2626", bg: "#FEF2F2" },
          { label: "Deduplicated", val: dedupTotal.toLocaleString(), color: "#7C3AED", bg: "#F5F3FF" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: s.bg, border: "1px solid #E2E8F0" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold font-heading" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}><h3 className="text-sm font-semibold text-slate-900">Recent Imports</h3></div>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>{["Scanner", "File", "Records", "New", "Duplicates", "Updated", "Invalid", "Date", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {scannerImports.map((imp, i) => {
              const sc = SCANNER_COLOR[imp.scanner] ?? { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" };
              const st = STATUS_CFG[imp.status];
              return (
                <tr key={imp.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < scannerImports.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/scanner-imports/${imp.id}`)}>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{imp.scanner}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-slate-700">{imp.file}</span></td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-900 tabular-nums">{imp.records.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold tabular-nums text-blue-700">{imp.newFindings.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold tabular-nums text-violet-700">{imp.duplicates.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold tabular-nums text-amber-700">{imp.updated.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold tabular-nums ${imp.invalid > 0 ? "text-red-600" : "text-slate-400"}`}>{imp.invalid}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(imp.date)}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.text }}>{st.icon} {imp.status}</span></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="h-4" />

      {processing && <ImportProcessingOverlay scanner={processing.scanner} file={processing.file} onComplete={finishImport} />}
    </div>
  );
}
