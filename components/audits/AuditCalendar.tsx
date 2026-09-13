"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, Plus } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { SEVERITY_CFG, StatusBadge } from "@/components/common/badges";
import { calculateAuditStatus } from "@/lib/business/audits";
import { formatDate, initials, ownerColor } from "@/lib/business/format";
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AuditCalendar() {
  const router = useRouter();
  const { audits } = useData();
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState<"month" | "list">("month");
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [buFilter, setBuFilter] = useState("");
  const [auditorFilter, setAuditorFilter] = useState("");
  const [scopeTypeFilter, setScopeTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const types = useMemo(() => Array.from(new Set(audits.map((a) => a.auditType))).sort(), [audits]);
  const bus = useMemo(() => Array.from(new Set(audits.map((a) => a.businessUnit))).sort(), [audits]);
  const auditors = useMemo(() => Array.from(new Set(audits.map((a) => a.auditor))).sort(), [audits]);
  const scopeTypes = useMemo(() => Array.from(new Set(audits.map((a) => a.scopeType))).sort(), [audits]);

  const filtered = useMemo(
    () =>
      audits.filter((a) => {
        if (typeFilter && a.auditType !== typeFilter) return false;
        if (statusFilter && calculateAuditStatus(a, now) !== statusFilter) return false;
        if (priorityFilter && a.priority !== priorityFilter) return false;
        if (buFilter && a.businessUnit !== buFilter) return false;
        if (auditorFilter && a.auditor !== auditorFilter) return false;
        if (scopeTypeFilter && a.scopeType !== scopeTypeFilter) return false;
        return true;
      }),
    [audits, typeFilter, statusFilter, priorityFilter, buFilter, auditorFilter, scopeTypeFilter, now]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const key = a.plannedStartDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [filtered]);

  const monthGrid = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [cursor]);

  const activeCount = [typeFilter, statusFilter, priorityFilter, buFilter, auditorFilter, scopeTypeFilter].filter(Boolean).length;
  const clearAll = () => { setTypeFilter(""); setStatusFilter(""); setPriorityFilter(""); setBuFilter(""); setAuditorFilter(""); setScopeTypeFilter(""); };

  const listSorted = [...filtered].sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Audit Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Plan and track security audits across the enterprise.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
          <Plus size={14} /> Schedule Audit
        </button>
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Filter by</span>
          <FilterSelect label="Audit Type" value={typeFilter} onChange={setTypeFilter} options={types} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["Planned", "Scheduled", "In Progress", "Findings Review", "Remediation", "Completed", "Cancelled", "Overdue"]} />
          <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={["Critical", "High", "Medium", "Low"]} />
          <FilterSelect label="Business Unit" value={buFilter} onChange={setBuFilter} options={bus} />
          <FilterSelect label="Auditor" value={auditorFilter} onChange={setAuditorFilter} options={auditors} />
          <FilterSelect label="Scope Type" value={scopeTypeFilter} onChange={setScopeTypeFilter} options={scopeTypes} />
          {activeCount > 0 && <button onClick={clearAll} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Clear all</button>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="flex items-center justify-center rounded-md" style={{ width: 30, height: 30, border: "1px solid #E2E8F0" }}><ChevronLeft size={14} className="text-slate-500" /></button>
          <span className="text-sm font-semibold text-slate-900 w-40 text-center">{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</span>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="flex items-center justify-center rounded-md" style={{ width: 30, height: 30, border: "1px solid #E2E8F0" }}><ChevronRight size={14} className="text-slate-500" /></button>
          <button onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))} className="text-xs text-blue-600 font-medium ml-1">Today</button>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
          {(["month", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all" style={{ background: view === v ? "#FFF" : "transparent", color: view === v ? "#0F172A" : "#64748B" }}>
              {v === "month" ? <LayoutGrid size={12} /> : <List size={12} />} {v === "month" ? "Month" : "List"}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <div className="grid grid-cols-7" style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>
            {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d, i) => {
              const key = toDateKey(d);
              const dayAudits = byDate.get(key) ?? [];
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = key === toDateKey(now);
              return (
                <div key={i} className="p-1.5 min-h-[92px]" style={{ borderRight: (i + 1) % 7 !== 0 ? "1px solid #F1F5F9" : "none", borderBottom: "1px solid #F1F5F9", background: inMonth ? "#FFFFFF" : "#FAFBFC" }}>
                  <div className="flex items-center justify-center rounded-full text-[11px] font-semibold mb-1" style={{ width: 20, height: 20, background: isToday ? "#2563EB" : "transparent", color: isToday ? "#FFFFFF" : inMonth ? "#334155" : "#CBD5E1" }}>{d.getDate()}</div>
                  <div className="space-y-1">
                    {dayAudits.slice(0, 3).map((a) => {
                      const cc = SEVERITY_CFG[a.priority];
                      return (
                        <div key={a.id} onClick={() => router.push(`/audits/${a.id}`)} className="rounded px-1.5 py-1 text-[10px] font-medium cursor-pointer truncate leading-tight" style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }} title={`${a.name} — ${a.auditType} — ${a.auditor}`}>
                          {a.name}
                        </div>
                      );
                    })}
                    {dayAudits.length > 3 && <div className="text-[10px] text-slate-400 pl-1">+{dayAudits.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>{["Date", "Audit", "Type", "Priority", "Scope", "Auditor", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
            <tbody>
              {listSorted.map((a, i) => (
                <tr key={a.id} className="cursor-pointer hover:bg-slate-50" style={{ borderBottom: i < listSorted.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/audits/${a.id}`)}>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(a.plannedStartDate)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0" style={{ width: 20, height: 20, background: ownerColor(a.auditor) }}>{initials(a.auditor)}</div><span className="text-xs font-bold text-slate-900">{a.name}</span></div></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.auditType}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: SEVERITY_CFG[a.priority].bg, color: SEVERITY_CFG[a.priority].text, border: `1px solid ${SEVERITY_CFG[a.priority].border}` }}>{a.priority}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{a.scopeName}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{a.auditor}</td>
                  <td className="px-4 py-3"><StatusBadge status={calculateAuditStatus(a, now)} /></td>
                </tr>
              ))}
              {listSorted.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No audits match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
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
