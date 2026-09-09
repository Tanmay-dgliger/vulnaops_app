"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, FileX } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { ExceptionStatus } from "@/types/exception";
import { formatDate } from "@/lib/business/format";

const STATUS_CFG: Record<ExceptionStatus, { bg: string; text: string }> = {
  "Pending Approval": { bg: "#FFFBEB", text: "#D97706" },
  Approved: { bg: "#F0FDF4", text: "#16A34A" },
  Rejected: { bg: "#FEF2F2", text: "#DC2626" },
  "More Info Requested": { bg: "#EFF6FF", text: "#2563EB" },
};

export default function ExceptionsList() {
  const router = useRouter();
  const { exceptions, getVulnerability } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => exceptions.map((e) => ({ exc: e, vuln: getVulnerability(e.vulnerabilityId) })), [exceptions, getVulnerability]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.exc.id.toLowerCase().includes(q) || (r.vuln?.cve.toLowerCase().includes(q) ?? false) || r.exc.type.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.exc.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Exceptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Risk exceptions, accepted risks, and false-positive dispositions</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search exceptions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
          {(["", "Pending Approval", "Approved", "Rejected"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className="rounded-md px-2.5 py-1 text-xs font-medium transition-all" style={{ background: statusFilter === s ? "#FFF" : "transparent", color: statusFilter === s ? "#0F172A" : "#64748B" }}>{s || "All"}</button>
          ))}
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} exceptions</div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>{["Exception", "CVE", "Type", "Status", "Requested By", "Valid Until", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((r, i) => {
              const sc = STATUS_CFG[r.exc.status];
              return (
                <tr key={r.exc.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/exceptions/${r.exc.id}`)}>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-slate-900">{r.exc.id}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-blue-700">{r.vuln?.cve ?? "—"}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-700">{r.exc.type}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: sc.bg, color: sc.text }}>{r.exc.status}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600">{r.exc.requestedBy}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(r.exc.validUntil)}</span></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center"><FileX size={24} className="text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-400 font-medium">No exceptions match your search.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="h-4" />
    </div>
  );
}
