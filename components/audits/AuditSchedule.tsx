"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { StatusBadge, SeverityBadge } from "@/components/common/badges";
import { calculateAuditStatus, getUpcomingAudits, getOverdueAudits } from "@/lib/business/audits";
import { formatDate } from "@/lib/business/format";
import ScheduleAuditModal from "./ScheduleAuditModal";

export default function AuditSchedule() {
  const router = useRouter();
  const { audits } = useData();
  const [showModal, setShowModal] = useState(false);
  const now = useMemo(() => new Date(), []);

  const upcoming = useMemo(() => getUpcomingAudits(audits, now), [audits, now]);
  const overdue = useMemo(() => getOverdueAudits(audits, now), [audits, now]);
  const thisMonth = audits.filter((a) => {
    const d = new Date(a.plannedStartDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const thisQuarter = audits.filter((a) => {
    const d = new Date(a.plannedStartDate);
    return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3);
  });
  const unassigned = audits.filter((a) => !a.auditor || a.auditor === "Unassigned");

  const sorted = [...audits].sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Audit Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">Plan and manage upcoming, overdue and recurring security audits</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
          <Plus size={14} /> Schedule Audit
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Upcoming Audits", val: upcoming.length, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Overdue Audits", val: overdue.length, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Audits This Month", val: thisMonth.length, color: "#0F172A", bg: "#F8FAFC" },
          { label: "Audits This Quarter", val: thisQuarter.length, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Unassigned Audits", val: unassigned.length, color: "#D97706", bg: "#FFFBEB" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: s.bg, border: "1px solid #E2E8F0" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold font-heading" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Audit", "Type", "Scope", "Priority", "Auditor", "Planned Start", "Planned End", "Next Audit", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {sorted.map((a, i) => {
              const status = calculateAuditStatus(a, now);
              return (
                <tr key={a.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < sorted.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/audits/${a.id}`)}>
                  <td className="px-4 py-3"><span className="text-xs font-bold text-slate-900">{a.name}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{a.auditType}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600">{a.scopeName}</span></td>
                  <td className="px-4 py-3"><SeverityBadge severity={a.priority} /></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-700">{a.auditor}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(a.plannedStartDate)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(a.plannedEndDate)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{a.nextAuditDate ? formatDate(a.nextAuditDate) : "—"}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={status} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
                </tr>
              );
            })}
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
