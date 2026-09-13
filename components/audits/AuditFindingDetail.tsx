"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import Modal from "@/components/common/Modal";
import { SeverityBadge, StatusBadge } from "@/components/common/badges";
import { formatDate } from "@/lib/business/format";

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function AuditFindingDetail({ findingId, onClose }: { findingId: string; onClose: () => void }) {
  const router = useRouter();
  const { getAuditFinding, getAudit, getAsset, getApplication, getApi, getRemediation, createRemediationFromAuditFinding, users } = useData();
  const [ownerChoice, setOwnerChoice] = useState("");

  const finding = getAuditFinding(findingId);
  if (!finding) return null;

  const audit = getAudit(finding.auditId);
  const asset = finding.assetId ? getAsset(finding.assetId) : undefined;
  const application = finding.applicationId ? getApplication(finding.applicationId) : undefined;
  const api = finding.apiId ? getApi(finding.apiId) : undefined;
  const remediation = finding.remediationId ? getRemediation(finding.remediationId) : undefined;

  const handleCreateRemediation = () => {
    const owner = ownerChoice || finding.owner || "Unassigned";
    const rem = createRemediationFromAuditFinding(finding.id, owner);
    onClose();
    router.push(`/remediation/${rem.id}`);
  };

  return (
    <Modal title={finding.title} subtitle={`Audit Finding ${finding.id}${audit ? ` · ${audit.name}` : ""}`} onClose={onClose} width={560}>
      <div className="flex items-center gap-2 mb-3">
        <SeverityBadge severity={finding.severity} />
        <StatusBadge status={finding.status} />
        <span className="text-xs text-slate-500">{finding.category}</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-4">{finding.description}</p>

      <div className="rounded-lg p-3 mb-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
        {audit && <Row label="Audit" value={audit.name} />}
        {application && <Row label="Application" value={application.name} />}
        {api && <Row label="API" value={api.name} />}
        {asset && <Row label="Affected Asset" value={asset.name} mono />}
        <Row label="Owner" value={finding.owner || "Unassigned"} />
        {finding.assignedTo && <Row label="Assigned To" value={finding.assignedTo} />}
        <Row label="Risk Score" value={`${finding.riskScore} / 100`} />
        <Row label="Due Date" value={finding.dueDate ? formatDate(finding.dueDate) : "—"} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {asset && <Link href={`/assets/${asset.id}`} className="text-xs text-blue-600 font-medium hover:underline">View asset →</Link>}
        {application && <Link href={`/applications/${application.id}`} className="text-xs text-blue-600 font-medium hover:underline">View application →</Link>}
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: "#E2E8F0" }}>
        <div className="text-xs font-semibold text-slate-900 mb-2">Remediation</div>
        {remediation ? (
          <button onClick={() => { onClose(); router.push(`/remediation/${remediation.id}`); }} className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all" style={{ background: "#F8FAFC", color: "#2563EB", border: "1px solid #BFDBFE" }}>
            Open Remediation <ArrowRight size={14} />
          </button>
        ) : (
          <div className="space-y-2">
            <select value={ownerChoice} onChange={(e) => setOwnerChoice(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <option value="">{finding.owner || "Assign owner…"}</option>
              {users.filter((u) => u.role !== "CISO").map((u) => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
            </select>
            <button onClick={handleCreateRemediation} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all" style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
              Create Remediation
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
