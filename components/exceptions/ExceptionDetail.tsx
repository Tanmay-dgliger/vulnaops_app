"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, FileText, Clock, CheckCircle2, XCircle, MessageSquare,
  Upload, AlertTriangle, Calendar, Check, Info,
} from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { formatDate } from "@/lib/business/format";
import { calculateAge } from "@/lib/business/sla";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "Pending Approval": { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: <Clock size={13} /> },
  Approved: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: <CheckCircle2 size={13} /> },
  Rejected: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: <XCircle size={13} /> },
  "More Info Requested": { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: <MessageSquare size={13} /> },
};

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
        {icon && <span className="text-slate-400">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MetaRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold ${mono ? "font-mono" : ""}`} style={{ color: color ?? "#0F172A" }}>{value}</span>
    </div>
  );
}

export default function ExceptionDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getException, getVulnerability, getAsset, getApplication, approveException, rejectException, requestMoreInfo } = useData();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const exc = getException(id);
  if (!exc) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Exception not found.</p></div>;
  }

  const vuln = getVulnerability(exc.vulnerabilityId);
  const asset = vuln ? getAsset(vuln.assetId) : undefined;
  const application = vuln ? getApplication(vuln.applicationId) : undefined;
  const sc = STATUS_CFG[exc.status];

  const totalDays = Math.max(1, Math.round((new Date(exc.validUntil).getTime() - new Date(exc.validFrom).getTime()) / 86400000));
  const daysElapsed = Math.max(0, calculateAge(exc.validFrom, new Date("2026-09-09")));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const actionTaken = exc.status === "Approved" ? "approve" : exc.status === "Rejected" ? "reject" : exc.status === "More Info Requested" ? "info" : null;

  const handleReject = () => {
    if (showRejectBox) {
      rejectException(exc.id, rejectReason);
      setShowRejectBox(false);
    } else {
      setShowRejectBox(true);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <button onClick={() => router.push("/exceptions")} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={13} /> Back to Exceptions</button>

      <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {vuln && <span className="font-mono text-xs font-bold text-blue-700 rounded px-2 py-0.5" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>{vuln.cve}</span>}
              <span className="text-slate-300 text-xs">/</span>
              <span className="text-xs font-semibold text-slate-600">{exc.id}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.icon} {exc.status}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1 font-heading">Risk Exception</h1>
            <p className="text-xs text-slate-500">{vuln?.title} · {vuln?.assetId} · {application?.name}</p>
          </div>
          <div className="rounded-xl p-4 text-center shrink-0" style={{ background: daysRemaining < 30 ? "#FEF2F2" : daysRemaining < 60 ? "#FFFBEB" : "#F0FDF4", border: `1px solid ${daysRemaining < 30 ? "#FECACA" : daysRemaining < 60 ? "#FDE68A" : "#BBF7D0"}`, minWidth: 140 }}>
            <div className="text-3xl font-bold font-heading" style={{ color: daysRemaining < 30 ? "#DC2626" : daysRemaining < 60 ? "#D97706" : "#16A34A" }}>{daysRemaining}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Days Remaining</div>
            <div className="text-[11px] text-slate-500 mt-1">Expires {formatDate(exc.validUntil)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-5">
          <Panel title="Exception Type" icon={<Shield size={15} />}>
            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>{exc.type}</div>
            <div className="rounded-lg p-3 mt-4 flex items-start gap-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
              <div><div className="text-[11px] font-semibold text-slate-700 mb-0.5">Reason for Exception</div><p className="text-xs text-slate-500">{exc.reason}</p></div>
            </div>
          </Panel>

          <Panel title="Business Justification" icon={<FileText size={15} />}>
            <p className="w-full rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>{exc.justification}</p>
            <div className="flex items-center justify-between mt-2"><span className="text-[10px] text-slate-400">{exc.justification.length} characters</span><span className="text-[10px] text-slate-400">Minimum 100 characters required for approval</span></div>
          </Panel>

          <Panel title="Compensating Controls" icon={<Shield size={15} />}>
            <div className="space-y-2">
              {exc.compensatingControls.length === 0 && <p className="text-xs text-slate-400">No compensating controls documented.</p>}
              {exc.compensatingControls.map((ctrl) => (
                <div key={ctrl} className="w-full flex items-start gap-3 p-3.5 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div className="flex items-center justify-center rounded-md shrink-0 mt-0.5" style={{ width: 20, height: 20, background: "#16A34A" }}><Check size={12} className="text-white" strokeWidth={3} /></div>
                  <div className="text-xs font-semibold text-green-700">{ctrl}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Supporting Evidence" icon={<Upload size={15} />}>
            <label className="flex items-center justify-center gap-2 rounded-xl py-4 border-2 border-dashed cursor-pointer" style={{ borderColor: "#E2E8F0" }}>
              <Upload size={16} className="text-slate-400" /><span className="text-xs font-medium text-slate-500">Upload additional evidence</span><input type="file" className="sr-only" multiple />
            </label>
          </Panel>
        </div>

        <div className="col-span-4 space-y-5">
          <Panel title="Approval Workflow" icon={<CheckCircle2 size={15} />}>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-4" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
              <span style={{ color: sc.color }}>{sc.icon}</span><span className="text-xs font-semibold" style={{ color: sc.color }}>{exc.status}</span>
            </div>
            <MetaRow label="Requested By" value={exc.requestedBy} />
            <MetaRow label="Approved By" value={exc.approvedBy || "Pending"} color={exc.approvedBy ? "#16A34A" : undefined} />

            {actionTaken ? (
              <div className="mt-4 rounded-lg p-3 flex items-center gap-2" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs font-semibold text-green-700">
                  {actionTaken === "approve" && "Exception approved and recorded"}
                  {actionTaken === "reject" && "Exception rejected — requestor notified"}
                  {actionTaken === "info" && "More information requested"}
                </span>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <button onClick={() => approveException(exc.id)} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#16A34A", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}><CheckCircle2 size={14} /> Approve Exception</button>
                {showRejectBox && (
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full p-3 text-xs text-slate-700 outline-none resize-none rounded-lg" rows={3} placeholder="Provide reason for rejection..." style={{ background: "#FEF2F2", border: "1px solid #FECACA" }} />
                )}
                <button onClick={handleReject} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all" style={{ color: "#DC2626", border: "1px solid #FECACA", background: showRejectBox ? "#FEF2F2" : "transparent" }}><XCircle size={14} /> {showRejectBox ? "Confirm Rejection" : "Reject"}</button>
                <button onClick={() => requestMoreInfo(exc.id)} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-blue-600 transition-all" style={{ border: "1px solid #BFDBFE" }}><MessageSquare size={14} /> Request More Information</button>
              </div>
            )}
          </Panel>

          <Panel title="Validity Period" icon={<Calendar size={15} />}>
            <div className="rounded-lg p-3 mb-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Start</span><span className="text-xs font-bold text-slate-900">{formatDate(exc.validFrom)}</span></div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "#E2E8F0" }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (daysElapsed / totalDays) * 100)}%`, background: "#16A34A" }} /></div>
              <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">End</span><span className="text-xs font-bold text-slate-900">{formatDate(exc.validUntil)}</span></div>
            </div>
            <MetaRow label="Duration" value={`${totalDays} days`} />
            <MetaRow label="Days Remaining" value={`${daysRemaining} days`} color="#16A34A" />
            <div className="mt-3 rounded-lg p-2.5 flex items-center gap-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
              <span className="text-[10px] text-amber-700 font-medium">Exception auto-expires on {formatDate(exc.validUntil)}. Renewal requires new approval.</span>
            </div>
          </Panel>

          {vuln && (
            <Panel title="Finding" icon={<AlertTriangle size={15} />}>
              <MetaRow label="CVE" value={vuln.cve} mono color="#DC2626" />
              <MetaRow label="Severity" value={`${vuln.severity} — CVSS ${vuln.cvss}`} color="#EA580C" />
              <MetaRow label="Asset" value={asset?.name ?? vuln.assetId} mono />
              <MetaRow label="Application" value={application?.name ?? "—"} />
              <MetaRow label="Environment" value={vuln.environment} color="#DC2626" />
              <MetaRow label="Scanner" value={vuln.scanner} />
            </Panel>
          )}
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
