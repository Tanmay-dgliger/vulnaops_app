"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { SeverityBadge, StatusBadge } from "@/components/common/badges";
import { formatDate } from "@/lib/business/format";
import AuditFindingDetail from "./AuditFindingDetail";

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-xs font-medium outline-none cursor-pointer"
        style={{ background: value ? "#EFF6FF" : "#F8FAFC", color: value ? "#2563EB" : "#64748B", border: `1px solid ${value ? "#BFDBFE" : "#E2E8F0"}` }}
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: value ? "#2563EB" : "#64748B" }} />
    </div>
  );
}

export default function AuditFindingsTable() {
  const { auditFindings, audits, assets, applications } = useData();
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [openFindingId, setOpenFindingId] = useState<string | null>(null);

  const auditById = useMemo(() => new Map(audits.map((a) => [a.id, a])), [audits]);
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const appById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);

  const categories = useMemo(() => Array.from(new Set(auditFindings.map((f) => f.category))).sort(), [auditFindings]);
  const owners = useMemo(() => Array.from(new Set(auditFindings.map((f) => f.owner).filter(Boolean))).sort() as string[], [auditFindings]);

  const filtered = auditFindings.filter((f) => {
    if (severityFilter && f.severity !== severityFilter) return false;
    if (statusFilter && f.status !== statusFilter) return false;
    if (categoryFilter && f.category !== categoryFilter) return false;
    if (ownerFilter && f.owner !== ownerFilter) return false;
    return true;
  });

  const activeCount = [severityFilter, statusFilter, categoryFilter, ownerFilter].filter(Boolean).length;
  const clearAll = () => { setSeverityFilter(""); setStatusFilter(""); setCategoryFilter(""); setOwnerFilter(""); };

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Audit Findings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Findings discovered during security audits, across all audits</p>
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Filter by</span>
          <FilterSelect label="Severity" value={severityFilter} onChange={setSeverityFilter} options={["Critical", "High", "Medium", "Low"]} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["Open", "Assigned", "In Remediation", "Pending Validation", "Closed", "Accepted Risk"]} />
          <FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories} />
          <FilterSelect label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={owners} />
          {activeCount > 0 && <button onClick={clearAll} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Clear all</button>}
          <div className="ml-auto text-xs text-slate-500 shrink-0"><span className="font-semibold text-slate-900">{filtered.length}</span> findings</div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Finding", "Audit", "Severity", "Category", "Affected Asset", "Application", "Owner", "Due Date", "Status", "Risk Score"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((f, i) => (
              <tr key={f.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => setOpenFindingId(f.id)}>
                <td className="px-4 py-3"><div className="text-xs font-semibold text-slate-800 max-w-[240px] truncate" title={f.title}>{f.title}</div><div className="text-[10px] text-slate-400 font-mono mt-0.5">{f.id}</div></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-600">{auditById.get(f.auditId)?.name ?? f.auditId}</span></td>
                <td className="px-4 py-3"><SeverityBadge severity={f.severity} /></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-500">{f.category}</span></td>
                <td className="px-4 py-3"><span className="font-mono text-xs text-slate-700">{f.assetId ? assetById.get(f.assetId)?.name ?? f.assetId : "—"}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-600">{f.applicationId ? appById.get(f.applicationId)?.name ?? f.applicationId : "—"}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-700">{f.owner || "Unassigned"}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-500">{f.dueDate ? formatDate(f.dueDate) : "—"}</span></td>
                <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-3"><span className="text-xs font-bold text-slate-700">{f.riskScore}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">No audit findings match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="h-4" />

      {openFindingId && <AuditFindingDetail findingId={openFindingId} onClose={() => setOpenFindingId(null)} />}
    </div>
  );
}
