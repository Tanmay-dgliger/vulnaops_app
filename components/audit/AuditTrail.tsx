"use client";

import { useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, Download, X, ArrowRight, RefreshCw,
  UserPlus, CheckCircle2, Upload, XCircle, GitMerge, AlertTriangle, Clock, FileText,
} from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { ActionType } from "@/types/activity";
import { initials, ownerColor } from "@/lib/business/format";

const ACTION_CFG: Record<ActionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  status_changed: { label: "Status Changed", color: "#2563EB", bg: "#EFF6FF", icon: <RefreshCw size={13} /> },
  assigned: { label: "Assignment Changed", color: "#7C3AED", bg: "#F5F3FF", icon: <UserPlus size={13} /> },
  triage_completed: { label: "Triage Completed", color: "#16A34A", bg: "#F0FDF4", icon: <CheckCircle2 size={13} /> },
  import: { label: "Finding Imported", color: "#64748B", bg: "#F8FAFC", icon: <Upload size={13} /> },
  false_positive: { label: "False Positive", color: "#94A3B8", bg: "#F8FAFC", icon: <XCircle size={13} /> },
  exception_approved: { label: "Exception Approved", color: "#16A34A", bg: "#F0FDF4", icon: <CheckCircle2 size={13} /> },
  exception_rejected: { label: "Exception Rejected", color: "#DC2626", bg: "#FEF2F2", icon: <XCircle size={13} /> },
  merged: { label: "Duplicate Merged", color: "#7C3AED", bg: "#F5F3FF", icon: <GitMerge size={13} /> },
  revalidation: { label: "Revalidation", color: "#2563EB", bg: "#EFF6FF", icon: <RefreshCw size={13} /> },
  comment: { label: "Comment Added", color: "#64748B", bg: "#F8FAFC", icon: <FileText size={13} /> },
  severity_override: { label: "Severity Override", color: "#D97706", bg: "#FFFBEB", icon: <AlertTriangle size={13} /> },
  sla_breach: { label: "SLA Breach", color: "#DC2626", bg: "#FEF2F2", icon: <Clock size={13} /> },
  validated: { label: "Remediation Validated", color: "#16A34A", bg: "#F0FDF4", icon: <CheckCircle2 size={13} /> },
  closed: { label: "Finding Closed", color: "#16A34A", bg: "#F0FDF4", icon: <CheckCircle2 size={13} /> },
};

const SEV_CFG: Record<string, { bg: string; text: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626" }, High: { bg: "#FFF7ED", text: "#EA580C" },
  Medium: { bg: "#FFFBEB", text: "#D97706" }, Low: { bg: "#F0FDF4", text: "#16A34A" },
};

function FilterSelect({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-md px-3 py-2 text-xs font-medium outline-none" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: value ? "#0F172A" : "#94A3B8" }}>
          <option value="">All</option>
          {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function AuditTrail() {
  const { activities } = useData();
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState<ActionType | "">("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const uniqueUsers = useMemo(() => Array.from(new Set(activities.map((e) => e.user))).sort(), [activities]);
  const entityTypes = useMemo(() => Array.from(new Set(activities.map((e) => e.entityType))).sort(), [activities]);
  const actionTypes = useMemo(() => Array.from(new Set(activities.map((e) => e.action))) as ActionType[], [activities]);

  const filtered = useMemo(() => {
    return activities.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.entity.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || (e.detail ?? "").toLowerCase().includes(q);
      const matchUser = !filterUser || e.user === filterUser;
      const matchAction = !filterAction || e.action === filterAction;
      const matchEntity = !filterEntity || e.entityType === filterEntity;
      return matchSearch && matchUser && matchAction && matchEntity;
    });
  }, [activities, search, filterUser, filterAction, filterEntity]);

  const activeFilterCount = [filterUser, filterAction, filterEntity].filter(Boolean).length;
  const clearFilters = () => { setFilterUser(""); setFilterAction(""); setFilterEntity(""); };

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Chronological record of all system and user activity</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }}><Download size={14} /> Export Audit Log</button>
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
          <div className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search by user, entity, CVE, action..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <button onClick={() => setFiltersOpen((v) => !v)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all" style={{ background: filtersOpen || activeFilterCount > 0 ? "#EFF6FF" : "#FAFBFC", color: filtersOpen || activeFilterCount > 0 ? "#2563EB" : "#334155", border: `1px solid ${filtersOpen || activeFilterCount > 0 ? "#BFDBFE" : "#E2E8F0"}` }}>
            <SlidersHorizontal size={14} /> Filters
            {activeFilterCount > 0 && <span className="flex items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ width: 16, height: 16, background: "#2563EB" }}>{activeFilterCount}</span>}
          </button>
          <div className="text-xs text-slate-500 font-medium shrink-0"><span className="font-semibold text-slate-900">{filtered.length}</span> events</div>
        </div>
        {filtersOpen && (
          <div className="px-4 py-4 grid grid-cols-3 gap-3 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
            <FilterSelect label="User" value={filterUser} onChange={setFilterUser} options={uniqueUsers} />
            <FilterSelect label="Action" value={filterAction} onChange={(v) => setFilterAction(v as ActionType | "")} options={actionTypes} labels={Object.fromEntries(actionTypes.map((a) => [a, ACTION_CFG[a].label]))} />
            <FilterSelect label="Entity Type" value={filterEntity} onChange={setFilterEntity} options={entityTypes} />
          </div>
        )}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-center"><div><Search size={28} className="text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400 font-medium">No audit events match your filters</p><button onClick={clearFilters} className="text-xs text-blue-600 mt-1">Clear filters</button></div></div>
        ) : (
          <div>
            {filtered.map((entry) => {
              const ac = ACTION_CFG[entry.action] ?? { label: entry.action, color: "#64748B", bg: "#F8FAFC", icon: <FileText size={13} /> };
              const isSystem = entry.user === "System";
              const isExpanded = expandedId === entry.id;
              return (
                <div key={entry.id} className="border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                  <div className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50/60" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                    <div className="shrink-0 mt-0.5"><div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ width: 30, height: 30, background: isSystem ? "#CBD5E1" : ownerColor(entry.user) }}>{initials(entry.user)}</div></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">{entry.timestamp.replace("T", " · ").slice(0, 16)}</span>
                        <span className="text-xs font-semibold text-slate-900">{entry.user}</span>
                        <span className="text-[10px] text-slate-400">{entry.userRole}</span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: ac.bg, color: ac.color }}>{ac.icon} {ac.label}</span>
                        <span className="font-mono text-[11px] font-bold text-blue-700">{entry.entity}</span>
                        {entry.severity && <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: SEV_CFG[entry.severity].bg, color: SEV_CFG[entry.severity].text }}>{entry.severity}</span>}
                      </div>
                      {entry.from && entry.to && (
                        <div className="flex items-center gap-1.5 text-xs mt-0.5">
                          <span className="rounded px-1.5 py-0.5 font-medium text-slate-500" style={{ background: "#F1F5F9" }}>{entry.from}</span>
                          <ArrowRight size={11} className="text-slate-300" />
                          <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: ac.bg, color: ac.color }}>{entry.to}</span>
                        </div>
                      )}
                      {entry.detail && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{entry.detail}</p>}
                    </div>
                    <div className="shrink-0 text-right"><div className="text-[10px] font-mono text-slate-300">{entry.ip}</div></div>
                  </div>
                  {isExpanded && (
                    <div className="px-14 pb-4">
                      <div className="rounded-xl p-4 grid grid-cols-3 gap-4" style={{ background: "#FAFBFC", border: "1px solid #F1F5F9" }}>
                        <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Event ID</div><div className="font-mono text-xs text-slate-700">{entry.id}</div></div>
                        <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Timestamp</div><div className="font-mono text-xs text-slate-700">{entry.timestamp.replace("T", " ")}</div></div>
                        <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Source IP</div><div className="font-mono text-xs text-slate-700">{entry.ip}</div></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400"><span>Showing {filtered.length} of {activities.length} audit events · Retained for 365 days</span></div>
      <div className="h-4" />
    </div>
  );
}
