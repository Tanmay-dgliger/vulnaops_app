"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/state/DataContext";
import Modal from "@/components/common/Modal";
import type { Audit, AuditFrequency, AuditPriority, AuditScopeType, AuditType } from "@/types/audit";
import type { ScheduleAuditInput } from "@/lib/state/DataContext";

const AUDIT_TYPES: AuditType[] = [
  "Security Audit", "Infrastructure Audit", "Application Audit", "API Security Audit",
  "Cloud Security Audit", "Internal Audit", "External Audit", "Compliance Audit",
];
const SCOPE_TYPES: AuditScopeType[] = ["APPLICATION", "ASSET", "API", "CLOUD_ASSET", "BUSINESS_SERVICE", "BUSINESS_UNIT"];
const SCOPE_LABEL: Record<AuditScopeType, string> = {
  APPLICATION: "Application", ASSET: "Asset", API: "API", CLOUD_ASSET: "Cloud Asset",
  BUSINESS_SERVICE: "Business Service", BUSINESS_UNIT: "Business Unit",
};
const PRIORITIES: AuditPriority[] = ["Critical", "High", "Medium", "Low"];
const FREQUENCIES: AuditFrequency[] = ["One Time", "Monthly", "Quarterly", "Half Yearly", "Annual"];

function field(label: string) {
  return <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">{label}</label>;
}
const inputStyle = { background: "#F8FAFC", border: "1px solid #E2E8F0" };
const inputClass = "w-full rounded-md px-3 py-2 text-sm outline-none";

export default function ScheduleAuditModal({
  defaultScopeType,
  defaultScopeId,
  onClose,
  onCreated,
}: {
  defaultScopeType?: AuditScopeType;
  defaultScopeId?: string;
  onClose: () => void;
  onCreated: (audit: Audit) => void;
}) {
  const { applications, assets, apis, cloudAssets, scheduleAudit } = useData();

  const [name, setName] = useState("");
  const [auditType, setAuditType] = useState<AuditType>("Application Audit");
  const [description, setDescription] = useState("");
  const [scopeType, setScopeType] = useState<AuditScopeType>(defaultScopeType ?? "APPLICATION");
  const [scopeId, setScopeId] = useState(defaultScopeId ?? "");
  const [businessUnit, setBusinessUnit] = useState("");
  const [priority, setPriority] = useState<AuditPriority>("Medium");
  const [auditor, setAuditor] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [frequency, setFrequency] = useState<AuditFrequency>("Annual");
  const [nextAuditDate, setNextAuditDate] = useState("");
  const [riskLevel, setRiskLevel] = useState<Audit["riskLevel"]>("Medium");
  const [notes, setNotes] = useState("");

  const businessUnits = useMemo(() => Array.from(new Set(assets.map((a) => a.businessUnit))).sort(), [assets]);

  const scopeOptions = useMemo(() => {
    if (scopeType === "APPLICATION") return applications.map((a) => ({ id: a.id, name: a.name }));
    if (scopeType === "ASSET") return assets.map((a) => ({ id: a.id, name: a.name }));
    if (scopeType === "API") return apis.map((a) => ({ id: a.id, name: a.name }));
    if (scopeType === "CLOUD_ASSET") return cloudAssets.map((c) => ({ id: c.id, name: c.name }));
    if (scopeType === "BUSINESS_UNIT") return businessUnits.map((u) => ({ id: u, name: u }));
    return [];
  }, [scopeType, applications, assets, apis, cloudAssets, businessUnits]);

  const isFreeTextScope = scopeType === "BUSINESS_SERVICE";
  const [freeScopeName, setFreeScopeName] = useState("");

  const canSubmit = name.trim() && auditor.trim() && plannedStartDate && plannedEndDate && (isFreeTextScope ? freeScopeName.trim() : scopeId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const scopeName = isFreeTextScope ? freeScopeName.trim() : scopeOptions.find((o) => o.id === scopeId)?.name ?? scopeId;
    const resolvedScopeId = isFreeTextScope ? freeScopeName.trim() : scopeId;
    const input: ScheduleAuditInput = {
      name: name.trim(),
      auditType,
      description: notes.trim() ? `${description.trim()}\n\nNotes: ${notes.trim()}` : description.trim(),
      scopeType,
      scopeId: resolvedScopeId,
      scopeName,
      businessUnit: businessUnit || businessUnits[0] || "Unassigned",
      priority,
      auditor: auditor.trim(),
      plannedStartDate,
      plannedEndDate,
      frequency,
      nextAuditDate: nextAuditDate || undefined,
      riskLevel,
    };
    const audit = scheduleAudit(input);
    onCreated(audit);
  };

  return (
    <Modal title="Schedule Audit" subtitle="Plan a new security audit and add it to the calendar" onClose={onClose} width={560}>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          {field("Audit Name")}
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Payment API Security Audit" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {field("Audit Type")}
            <select value={auditType} onChange={(e) => setAuditType(e.target.value as AuditType)} className={inputClass} style={inputStyle}>
              {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            {field("Priority")}
            <select value={priority} onChange={(e) => setPriority(e.target.value as AuditPriority)} className={inputClass} style={inputStyle}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          {field("Description")}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} style={inputStyle} placeholder="What does this audit cover?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {field("Scope Type")}
            <select value={scopeType} onChange={(e) => { setScopeType(e.target.value as AuditScopeType); setScopeId(""); }} className={inputClass} style={inputStyle}>
              {SCOPE_TYPES.map((t) => <option key={t} value={t}>{SCOPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            {field("Scope")}
            {isFreeTextScope ? (
              <input value={freeScopeName} onChange={(e) => setFreeScopeName(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Payments" />
            ) : (
              <select value={scopeId} onChange={(e) => setScopeId(e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">Select…</option>
                {scopeOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {field("Business Unit")}
            <select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">Select…</option>
              {businessUnits.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            {field("Auditor")}
            <input value={auditor} onChange={(e) => setAuditor(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Anita Rao" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {field("Planned Start")}
            <input type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            {field("Planned End")}
            <input type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {field("Frequency")}
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as AuditFrequency)} className={inputClass} style={inputStyle}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            {field("Next Audit Date")}
            <input type="date" value={nextAuditDate} onChange={(e) => setNextAuditDate(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {field("Risk Level (optional)")}
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as Audit["riskLevel"])} className={inputClass} style={inputStyle}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            {field("Notes (optional)")}
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} style={inputStyle} placeholder="Additional context" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
        <button onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-md px-3 py-2 text-sm font-semibold text-white"
          style={{ background: canSubmit ? "#2563EB" : "#CBD5E1", cursor: canSubmit ? "pointer" : "not-allowed" }}
        >
          Schedule Audit
        </button>
      </div>
    </Modal>
  );
}
