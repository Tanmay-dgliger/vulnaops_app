"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, AppWindow, Server, Plug, Cloud, Building2 } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { AuditStatus } from "@/types/audit";
import { SeverityBadge, StatusBadge } from "@/components/common/badges";
import { calculateAuditStatus, getAuditScopeItems, getAuditFindingsFor, getAuditHistory } from "@/lib/business/audits";
import { formatDate, initials, ownerColor } from "@/lib/business/format";
import AuditFindingDetail from "./AuditFindingDetail";
import Modal from "@/components/common/Modal";
import { AUDIT_FINDING_CATEGORIES } from "@/types/audit-finding";
import type { VulnerabilitySeverity } from "@/types/vulnerability";

const STATUS_FLOW: AuditStatus[] = ["Planned", "Scheduled", "In Progress", "Findings Review", "Remediation", "Completed"];

function SectionCard({ title, icon, children, action }: { title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9" }}>
        <div className="flex items-center gap-2">{icon && <span className="text-slate-400">{icon}</span>}<h3 className="text-sm font-semibold text-slate-900">{title}</h3></div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function MetaRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xs font-semibold text-right" style={{ color: color ?? "#0F172A" }}>{value}</span>
    </div>
  );
}

function CreateFindingModal({ auditId, onClose }: { auditId: string; onClose: () => void }) {
  const { createAuditFinding } = useData();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(AUDIT_FINDING_CATEGORIES[0]);
  const [severity, setSeverity] = useState<VulnerabilitySeverity>("Medium");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");

  const canSubmit = title.trim().length > 0;
  const inputStyle = { background: "#F8FAFC", border: "1px solid #E2E8F0" };
  const inputClass = "w-full rounded-md px-3 py-2 text-sm outline-none";

  return (
    <Modal title="Create Finding" subtitle="Record a new finding discovered during this audit" onClose={onClose} width={480}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. MFA not enforced for admin accounts" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} style={inputStyle}>
              {AUDIT_FINDING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as VulnerabilitySeverity)} className={inputClass} style={inputStyle}>
              {(["Critical", "High", "Medium", "Low"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Owner</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} style={inputStyle} placeholder="Unassigned" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
        <button onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }}>Cancel</button>
        <button
          disabled={!canSubmit}
          onClick={() => { createAuditFinding(auditId, { title: title.trim(), description: description.trim(), category, severity, owner: owner || undefined, dueDate: dueDate || undefined }); onClose(); }}
          className="rounded-md px-3 py-2 text-sm font-semibold text-white"
          style={{ background: canSubmit ? "#2563EB" : "#CBD5E1", cursor: canSubmit ? "pointer" : "not-allowed" }}
        >
          Create Finding
        </button>
      </div>
    </Modal>
  );
}

type Tab = "overview" | "scope" | "findings" | "remediation" | "timeline" | "history";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "scope", label: "Scope" },
  { id: "findings", label: "Findings" },
  { id: "remediation", label: "Remediation" },
  { id: "timeline", label: "Timeline" },
  { id: "history", label: "Audit History" },
];

const SCOPE_ICON: Record<string, React.ReactNode> = {
  APPLICATION: <AppWindow size={13} />, ASSET: <Server size={13} />, API: <Plug size={13} />,
  CLOUD_ASSET: <Cloud size={13} />, BUSINESS_SERVICE: <Building2 size={13} />, BUSINESS_UNIT: <Building2 size={13} />,
};
const SCOPE_GROUP_LABEL: Record<string, string> = {
  APPLICATION: "Applications", ASSET: "Servers / Assets", API: "APIs", CLOUD_ASSET: "Cloud",
  BUSINESS_SERVICE: "Business Services", BUSINESS_UNIT: "Business Units",
};
const SCOPE_ROUTE: Record<string, (id: string) => string | null> = {
  APPLICATION: (id) => `/applications/${id}`,
  ASSET: (id) => `/assets/${id}`,
  API: () => null,
  CLOUD_ASSET: () => null,
  BUSINESS_SERVICE: () => null,
  BUSINESS_UNIT: () => null,
};

export default function AuditDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getAudit, audits, auditScopes, auditFindings, activities, updateAuditStatus } = useData();
  const [tab, setTab] = useState<Tab>("overview");
  const [openFindingId, setOpenFindingId] = useState<string | null>(null);
  const [showCreateFinding, setShowCreateFinding] = useState(false);
  const [findingSeverityFilter, setFindingSeverityFilter] = useState("");
  const [findingStatusFilter, setFindingStatusFilter] = useState("");
  const now = useMemo(() => new Date(), []);

  const audit = getAudit(id);
  if (!audit) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Audit not found.</p></div>;
  }

  const effectiveStatus = calculateAuditStatus(audit, now);
  const scopeItems = getAuditScopeItems(audit.id, auditScopes);
  const findings = getAuditFindingsFor(audit.id, auditFindings);
  const openFindings = findings.filter((f) => f.status !== "Closed" && f.status !== "Accepted Risk");
  const daysRemaining = Math.ceil((new Date(audit.plannedEndDate).getTime() - now.getTime()) / 86400000);
  const daysOverdue = effectiveStatus === "Overdue" ? Math.abs(daysRemaining) : 0;
  const auditActivities = activities.filter((a) => a.entity === audit.name);
  const scopeHistory = getAuditHistory(audit.scopeId, audits, auditScopes, auditFindings).filter((h) => h.audit.id !== audit.id);

  const groupedScope = scopeItems.reduce<Record<string, typeof scopeItems>>((acc, s) => {
    (acc[s.scopeType] ??= []).push(s);
    return acc;
  }, {});

  const filteredFindings = findings.filter(
    (f) => (!findingSeverityFilter || f.severity === findingSeverityFilter) && (!findingStatusFilter || f.status === findingStatusFilter)
  );

  const remediationBuckets = {
    open: findings.filter((f) => f.status === "Open" || f.status === "Assigned").length,
    inProgress: findings.filter((f) => f.status === "In Remediation" || f.status === "Pending Validation").length,
    closed: findings.filter((f) => f.status === "Closed" || f.status === "Accepted Risk").length,
  };

  const overallResult = findings.length === 0 ? "No Findings" : audit.criticalFindings + audit.highFindings > 0 ? "Needs Improvement" : "Satisfactory";

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(audit.status) + 1];

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <button onClick={() => router.push("/audits")} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={13} /> Back to Audits</button>

      <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{audit.id}</span>
              <StatusBadge status={effectiveStatus} />
              <SeverityBadge severity={audit.priority} />
              <span className="text-xs text-slate-500">{audit.auditType}</span>
              {effectiveStatus === "Overdue" && <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold" style={{ background: "#FEF2F2", color: "#DC2626" }}>OVERDUE — {daysOverdue}d</span>}
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1 font-heading">{audit.name}</h1>
            <p className="text-xs text-slate-500">Scope: {audit.scopeName} · Auditor: {audit.auditor}</p>
          </div>
          <div className="flex items-center gap-2">
            {audit.status !== "Completed" && audit.status !== "Cancelled" && nextStatus && (
              <button onClick={() => updateAuditStatus(audit.id, nextStatus)} className="rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ background: "#2563EB" }}>
                Mark {nextStatus}
              </button>
            )}
            {audit.status !== "Completed" && audit.status !== "Cancelled" && (
              <button onClick={() => updateAuditStatus(audit.id, "Cancelled")} className="rounded-md px-3 py-2 text-xs font-medium" style={{ background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
                Cancel Audit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          {[
            { label: "Audit Status", val: effectiveStatus, color: "#0F172A" },
            { label: "Scope Items", val: String(scopeItems.length), color: "#2563EB" },
            { label: "Findings", val: String(findings.length), color: "#0F172A" },
            { label: "Critical Findings", val: String(audit.criticalFindings), color: "#DC2626" },
            { label: "High Findings", val: String(audit.highFindings), color: "#EA580C" },
            { label: "Days Remaining", val: effectiveStatus === "Overdue" ? `${daysOverdue}d overdue` : audit.status === "Completed" ? "—" : `${daysRemaining}d`, color: daysRemaining < 0 ? "#DC2626" : "#0F172A" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
              <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-0 border-b" style={{ borderColor: "#E2E8F0" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap" style={{ color: tab === t.id ? "#2563EB" : "#64748B" }}>
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#2563EB" }} />}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 space-y-5">
            <SectionCard title="Audit Overview">
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <MetaRow label="Audit Type" value={audit.auditType} />
                  <MetaRow label="Business Unit" value={audit.businessUnit} />
                  <MetaRow label="Owner" value={audit.owner} />
                  <MetaRow label="Auditor" value={audit.auditor} />
                  <MetaRow label="Frequency" value={audit.frequency} />
                </div>
                <div>
                  <MetaRow label="Planned Start" value={formatDate(audit.plannedStartDate)} />
                  <MetaRow label="Planned End" value={formatDate(audit.plannedEndDate)} />
                  <MetaRow label="Actual Start" value={audit.actualStartDate ? formatDate(audit.actualStartDate) : "—"} />
                  <MetaRow label="Actual End" value={audit.actualEndDate ? formatDate(audit.actualEndDate) : "—"} />
                  <MetaRow label="Last Audit" value={audit.lastAuditDate ? formatDate(audit.lastAuditDate) : "—"} />
                  <MetaRow label="Next Audit" value={audit.nextAuditDate ? formatDate(audit.nextAuditDate) : "—"} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{audit.description}</p>
              </div>
            </SectionCard>

            {audit.status === "Completed" && (
              <SectionCard title="Audit Result Summary">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">Overall Result</span>
                  <span className="text-sm font-bold" style={{ color: overallResult === "Needs Improvement" ? "#DC2626" : overallResult === "No Findings" ? "#64748B" : "#16A34A" }}>{overallResult}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[{ l: "Critical", v: audit.criticalFindings, c: "#DC2626" }, { l: "High", v: audit.highFindings, c: "#EA580C" }, { l: "Medium", v: audit.mediumFindings, c: "#D97706" }, { l: "Low", v: audit.lowFindings, c: "#16A34A" }].map((s) => (
                    <div key={s.l} className="rounded-lg p-2.5 text-center" style={{ background: `${s.c}0D`, border: `1px solid ${s.c}22` }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.c }}>{s.l}</div>
                      <div className="text-lg font-bold text-slate-900">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Remediation</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2.5 text-center" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}><div className="text-[10px] text-slate-500">Open</div><div className="text-sm font-bold text-slate-900">{remediationBuckets.open}</div></div>
                  <div className="rounded-lg p-2.5 text-center" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}><div className="text-[10px] text-blue-600">In Progress</div><div className="text-sm font-bold text-slate-900">{remediationBuckets.inProgress}</div></div>
                  <div className="rounded-lg p-2.5 text-center" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}><div className="text-[10px] text-green-600">Closed</div><div className="text-sm font-bold text-slate-900">{remediationBuckets.closed}</div></div>
                </div>
              </SectionCard>
            )}
          </div>
          <div className="col-span-4 space-y-5">
            <SectionCard title="Recurring Schedule">
              <MetaRow label="Frequency" value={audit.frequency} />
              <MetaRow label="Last Audit" value={audit.lastAuditDate ? formatDate(audit.lastAuditDate) : "—"} />
              <MetaRow label="Next Audit" value={audit.nextAuditDate ? formatDate(audit.nextAuditDate) : "—"} color="#2563EB" />
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "scope" && (
        <SectionCard title="Scope">
          {scopeItems.length === 0 ? (
            <p className="text-xs text-slate-400">No scope items recorded.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedScope).map(([type, items]) => (
                <div key={type}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{SCOPE_ICON[type]} {SCOPE_GROUP_LABEL[type] ?? type}</div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => {
                      const route = SCOPE_ROUTE[s.scopeType]?.(s.scopeId);
                      const content = (
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: route ? "#2563EB" : "#334155" }}>
                          {s.scopeName}
                        </span>
                      );
                      return route ? <Link key={`${s.scopeType}-${s.scopeId}`} href={route} className="hover:opacity-80">{content}</Link> : <div key={`${s.scopeType}-${s.scopeId}`}>{content}</div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {tab === "findings" && (
        <SectionCard
          title={`Findings (${findings.length})`}
          action={<button onClick={() => setShowCreateFinding(true)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#2563EB" }}><Plus size={12} /> Create Finding</button>}
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {["", "Critical", "High", "Medium", "Low"].map((s) => (
              <button key={s || "all"} onClick={() => setFindingSeverityFilter(s)} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: findingSeverityFilter === s ? "#EFF6FF" : "#F8FAFC", color: findingSeverityFilter === s ? "#2563EB" : "#64748B", border: `1px solid ${findingSeverityFilter === s ? "#BFDBFE" : "#E2E8F0"}` }}>{s || "All Severities"}</button>
            ))}
            {["", "Open", "Assigned", "In Remediation", "Pending Validation", "Closed", "Accepted Risk"].map((s) => (
              <button key={s || "all-status"} onClick={() => setFindingStatusFilter(s)} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: findingStatusFilter === s ? "#EFF6FF" : "#F8FAFC", color: findingStatusFilter === s ? "#2563EB" : "#64748B", border: `1px solid ${findingStatusFilter === s ? "#BFDBFE" : "#E2E8F0"}` }}>{s || "All Statuses"}</button>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["Finding", "Severity", "Category", "Owner", "Due Date", "Status", "Risk"].map((h) => <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
            <tbody>
              {filteredFindings.map((f, i) => (
                <tr key={f.id} className="cursor-pointer hover:bg-slate-50" style={{ borderBottom: i < filteredFindings.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => setOpenFindingId(f.id)}>
                  <td className="px-3 py-2.5"><div className="text-xs font-semibold text-slate-800">{f.title}</div></td>
                  <td className="px-3 py-2.5"><SeverityBadge severity={f.severity} /></td>
                  <td className="px-3 py-2.5"><span className="text-xs text-slate-500">{f.category}</span></td>
                  <td className="px-3 py-2.5"><span className="text-xs text-slate-700">{f.owner || "Unassigned"}</span></td>
                  <td className="px-3 py-2.5"><span className="text-xs text-slate-500">{f.dueDate ? formatDate(f.dueDate) : "—"}</span></td>
                  <td className="px-3 py-2.5"><StatusBadge status={f.status} /></td>
                  <td className="px-3 py-2.5"><span className="text-xs font-bold text-slate-700">{f.riskScore}</span></td>
                </tr>
              ))}
              {filteredFindings.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-xs text-slate-400">No findings recorded for this audit yet.</td></tr>}
            </tbody>
          </table>
        </SectionCard>
      )}

      {tab === "remediation" && (
        <SectionCard title="Remediation Status">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg p-3 text-center" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}><div className="text-[10px] text-slate-500">Open</div><div className="text-xl font-bold text-slate-900">{remediationBuckets.open}</div></div>
            <div className="rounded-lg p-3 text-center" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}><div className="text-[10px] text-blue-600">In Progress</div><div className="text-xl font-bold text-slate-900">{remediationBuckets.inProgress}</div></div>
            <div className="rounded-lg p-3 text-center" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}><div className="text-[10px] text-green-600">Closed</div><div className="text-xl font-bold text-slate-900">{remediationBuckets.closed}</div></div>
          </div>
          <div className="space-y-2">
            {findings.filter((f) => f.remediationId).map((f) => (
              <Link key={f.id} href={`/remediation/${f.remediationId}`} className="flex items-center justify-between rounded-lg p-3 hover:bg-slate-50 transition-colors" style={{ border: "1px solid #E2E8F0" }}>
                <span className="text-xs font-semibold text-slate-800">{f.title}</span>
                <span className="text-xs text-blue-600 font-medium">Open remediation →</span>
              </Link>
            ))}
            {findings.filter((f) => f.remediationId).length === 0 && <p className="text-xs text-slate-400">No remediation tasks have been created from this audit's findings yet.</p>}
          </div>
        </SectionCard>
      )}

      {tab === "timeline" && (
        <SectionCard title="Timeline">
          <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-1">
            {STATUS_FLOW.map((s, i) => {
              const reached = STATUS_FLOW.indexOf(audit.status) >= i || audit.status === "Completed";
              return (
                <div key={s} className="flex items-center shrink-0">
                  <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ background: reached ? "#EFF6FF" : "#F8FAFC", color: reached ? "#2563EB" : "#94A3B8" }}>{s}</div>
                  {i < STATUS_FLOW.length - 1 && <div className="w-6 h-px mx-1" style={{ background: "#E2E8F0" }} />}
                </div>
              );
            })}
          </div>
          {auditActivities.length === 0 && <p className="text-xs text-slate-400">No status history recorded yet.</p>}
          <div className="space-y-0">
            {auditActivities.map((evt, i) => (
              <div key={evt.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 mt-0.5" style={{ width: 26, height: 26, background: ownerColor(evt.user) }}>{initials(evt.user)}</div>
                  {i < auditActivities.length - 1 && <div className="w-px flex-1 my-1" style={{ background: "#E2E8F0", minHeight: 20 }} />}
                </div>
                <div className="pb-4 min-w-0">
                  <div className="text-xs"><span className="font-semibold text-slate-800">{evt.user}</span> <span className="text-slate-500">{evt.detail ?? evt.action.replace(/_/g, " ")}</span> {evt.to && <span className="font-semibold text-blue-600">{evt.to}</span>}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{evt.timestamp.replace("T", " · ")}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === "history" && (
        <SectionCard title={`Audit History — ${audit.scopeName}`}>
          {scopeHistory.length === 0 ? (
            <p className="text-xs text-slate-400">No other audits recorded for this scope yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9" }}>{["Audit", "Type", "Status", "Planned Start", "Open Findings"].map((h) => <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {scopeHistory.map((h) => (
                  <tr key={h.audit.id} className="cursor-pointer hover:bg-slate-50" style={{ borderBottom: "1px solid #F8FAFC" }} onClick={() => router.push(`/audits/${h.audit.id}`)}>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{h.audit.name}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{h.audit.auditType}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={calculateAuditStatus(h.audit, now)} /></td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{formatDate(h.audit.plannedStartDate)}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">{h.openFindings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      <div className="h-4" />

      {openFindingId && <AuditFindingDetail findingId={openFindingId} onClose={() => setOpenFindingId(null)} />}
      {showCreateFinding && <CreateFindingModal auditId={audit.id} onClose={() => setShowCreateFinding(false)} />}
    </div>
  );
}
