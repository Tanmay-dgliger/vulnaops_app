"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { StatusBadge, SeverityBadge } from "@/components/common/badges";
import { calculateAuditStatus } from "@/lib/business/audits";
import { formatDate } from "@/lib/business/format";
import ScheduleAuditModal from "./ScheduleAuditModal";

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

interface AuditTableProps {
  initialStatus?: string;
}

export default function AuditTable({ initialStatus }: AuditTableProps = {}) {
  const router = useRouter();
  const { audits } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => initialStatus ?? "");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [buFilter, setBuFilter] = useState("");
  const [scopeTypeFilter, setScopeTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const now = useMemo(() => new Date(), []);

  const types = useMemo(() => Array.from(new Set(audits.map((a) => a.auditType))).sort(), [audits]);
  const bus = useMemo(() => Array.from(new Set(audits.map((a) => a.businessUnit))).sort(), [audits]);
  const scopeTypes = useMemo(() => Array.from(new Set(audits.map((a) => a.scopeType))).sort(), [audits]);

  const rows = audits.map((a) => ({ audit: a, effectiveStatus: calculateAuditStatus(a, now) }));

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !r.audit.name.toLowerCase().includes(q) && !r.audit.scopeName.toLowerCase().includes(q) && !r.audit.auditor.toLowerCase().includes(q)) return false;
    if (typeFilter && r.audit.auditType !== typeFilter) return false;
    if (statusFilter && r.effectiveStatus !== statusFilter) return false;
    if (priorityFilter && r.audit.priority !== priorityFilter) return false;
    if (buFilter && r.audit.businessUnit !== buFilter) return false;
    if (scopeTypeFilter && r.audit.scopeType !== scopeTypeFilter) return false;
    return true;
  });

  const clearAll = () => { setTypeFilter(""); setStatusFilter(""); setPriorityFilter(""); setBuFilter(""); setScopeTypeFilter(""); };
  const activeCount = [typeFilter, statusFilter, priorityFilter, buFilter, scopeTypeFilter].filter(Boolean).length;

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Audits</h1>
          <p className="text-sm text-slate-500 mt-0.5">All planned, in-progress and completed security audits</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
          <Plus size={14} /> Schedule Audit
        </button>
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search audits, scope, auditor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0"><span className="font-semibold text-slate-900">{filtered.length}</span><span>audits</span></div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Filter by</span>
          <FilterSelect label="Audit Type" value={typeFilter} onChange={setTypeFilter} options={types} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["Planned", "Scheduled", "In Progress", "Findings Review", "Remediation", "Completed", "Cancelled", "Overdue"]} />
          <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={["Critical", "High", "Medium", "Low"]} />
          <FilterSelect label="Business Unit" value={buFilter} onChange={setBuFilter} options={bus} />
          <FilterSelect label="Scope Type" value={scopeTypeFilter} onChange={setScopeTypeFilter} options={scopeTypes} />
          {activeCount > 0 && <button onClick={clearAll} className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><X size={12} /> Clear all</button>}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Audit", "Type", "Scope", "Priority", "Auditor", "Planned Start", "Planned End", "Findings", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.audit.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/audits/${r.audit.id}`)}>
                <td className="px-4 py-3"><span className="text-xs font-bold text-slate-900">{r.audit.name}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-500">{r.audit.auditType}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-600">{r.audit.scopeName}</span></td>
                <td className="px-4 py-3"><SeverityBadge severity={r.audit.priority} /></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-700">{r.audit.auditor}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(r.audit.plannedStartDate)}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(r.audit.plannedEndDate)}</span></td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-slate-700">{r.audit.findingCount}</span>
                  {r.audit.criticalFindings > 0 && <span className="ml-1 text-[10px] font-bold text-red-600">({r.audit.criticalFindings} crit)</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.effectiveStatus} /></td>
                <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">No audits match your search.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="h-4" />

      {showModal && (
        <ScheduleAuditModal
          onClose={() => setShowModal(false)}
          onCreated={(audit) => { setShowModal(false); router.push(`/audits/${audit.id}`); }}
        />
      )}
    </div>
  );
}
