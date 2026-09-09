"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Upload, RefreshCw, Paperclip, ExternalLink, AlertTriangle, Check, ChevronRight, Sparkles } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { formatDate } from "@/lib/business/format";
import { calculateSlaStatus } from "@/lib/business/sla";
import { StatusBadge } from "@/components/common/badges";

function MetaRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold ${mono ? "font-mono" : ""}`} style={{ color: color ?? "#0F172A" }}>{value}</span>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function RemediationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getRemediation, getVulnerability, getAsset, getApplication, toggleChecklistItem, requestRevalidation, simulateValidation, addComment } = useData();
  const [comment, setComment] = useState("");

  const rem = getRemediation(id);
  if (!rem) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Remediation task not found.</p></div>;
  }
  const vuln = getVulnerability(rem.vulnerabilityId);
  const asset = vuln ? getAsset(vuln.assetId) : undefined;
  const application = vuln ? getApplication(vuln.applicationId) : undefined;
  const sla = vuln ? calculateSlaStatus(vuln.severity, vuln.firstSeen, vuln.status) : null;

  const doneCount = rem.checklist.filter((i) => i.done).length;
  const isClosed = rem.status === "Closed";

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <button onClick={() => router.push("/remediation")} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={13} /> Back to Remediation Board</button>

      <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              {vuln && <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{vuln.cve}</span>}
              {vuln && <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {vuln.severity.toUpperCase()}</span>}
              <StatusBadge status={rem.status} />
              {sla?.state === "Breached" && <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: "#FEF2F2", color: "#DC2626" }}>SLA Breached · {sla.label}</span>}
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1 font-heading">{rem.action}</h1>
            <p className="text-xs text-slate-500">{vuln?.title} · {vuln?.assetId} · {application?.name}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold" style={{ color: "#2563EB" }}>{rem.progress}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${rem.progress}%`, background: rem.progress >= 80 ? "#16A34A" : rem.progress >= 50 ? "#2563EB" : "#D97706" }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-slate-400">{doneCount} of {rem.checklist.length} steps complete</span>
            <span className="text-[10px] text-slate-400">Target: {formatDate(rem.targetDate)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-5">
          <Panel title={`Remediation Checklist (${doneCount}/${rem.checklist.length})`}>
            <div className="space-y-2">
              {rem.checklist.map((item) => (
                <div key={item.id} onClick={() => toggleChecklistItem(rem.id, item.id)} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group" style={{ background: item.done ? "#F0FDF4" : "#FAFBFC", border: `1px solid ${item.done ? "#BBF7D0" : "#E2E8F0"}` }}>
                  {item.done ? <CheckCircle2 size={18} className="text-green-500 shrink-0" /> : <Circle size={18} className="text-slate-300 shrink-0 group-hover:text-slate-400" />}
                  <span className={`text-sm ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Evidence & Attachments" action={<label className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-blue-50" style={{ color: "#2563EB", border: "1px solid #BFDBFE", background: "#EFF6FF" }}><Upload size={12} /> Upload Evidence<input type="file" className="sr-only" /></label>}>
            <div className="space-y-2">
              {rem.evidence.length === 0 && <p className="text-xs text-slate-400">No evidence uploaded yet.</p>}
              {rem.evidence.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div className="flex items-center justify-center rounded-md w-8 h-8 shrink-0" style={{ background: "#EFF6FF" }}><Paperclip size={14} className="text-blue-500" /></div>
                  <div className="flex-1 min-w-0"><div className="text-xs font-medium text-slate-800 truncate">{f.name}</div><div className="text-[10px] text-slate-400 mt-0.5">{f.size} · Uploaded {formatDate(f.date)}</div></div>
                  <ExternalLink size={13} className="text-blue-500" />
                </div>
              ))}
            </div>
            <div className="mt-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6" style={{ borderColor: "#E2E8F0" }}>
              <Upload size={20} className="text-slate-300 mb-1.5" />
              <p className="text-xs text-slate-400 font-medium">Drop files here or <span className="text-blue-600">browse</span></p>
              <p className="text-[10px] text-slate-300 mt-0.5">PDF, TXT, XML, PNG up to 25 MB</p>
            </div>
          </Panel>

          <Panel title="Validation Results">
            {rem.validationResult === "Passed" ? (
              <div className="rounded-lg p-4 flex items-start gap-3 mb-4" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <CheckCircle2 size={15} className="text-green-500 mt-0.5 shrink-0" />
                <div><div className="text-xs font-semibold text-green-700 mb-0.5">Validation Passed — {formatDate(rem.lastScanDate)}</div><div className="text-xs text-green-600">{rem.lastScanResult}. Vulnerability confirmed remediated.</div></div>
              </div>
            ) : rem.lastScanResult ? (
              <div className="rounded-lg p-4 flex items-start gap-3 mb-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <div><div className="text-xs font-semibold text-red-700 mb-0.5">Last Validation Scan — {formatDate(rem.lastScanDate)}</div><div className="text-xs text-red-600">{rem.lastScanResult}. {vuln?.title} confirmed present on {vuln?.assetId}.</div></div>
              </div>
            ) : (
              <div className="rounded-lg p-4 mb-4 text-xs text-slate-500" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>No validation scan has been requested yet.</div>
            )}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Last Scan Date", value: rem.lastScanDate ? formatDate(rem.lastScanDate) : "—" },
                { label: "Scanner", value: vuln?.scanner ?? "—" },
                { label: "Result", value: rem.validationResult, color: rem.validationResult === "Passed" ? "#16A34A" : rem.validationResult === "Pending" ? "#D97706" : "#0F172A" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</div>
                  <div className="text-xs font-semibold" style={{ color: f.color ?? "#0F172A" }}>{f.value}</div>
                </div>
              ))}
            </div>
            {!isClosed && (
              <div className="space-y-2">
                <button onClick={() => requestRevalidation(rem.id)} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all" style={{ background: "#2563EB", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
                  <RefreshCw size={15} /> Request Revalidation
                </button>
                <button onClick={() => simulateValidation(rem.id)} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all hover:opacity-90" style={{ background: "#16A34A", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                  <Sparkles size={15} /> Simulate Successful Validation
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1">Demo action — confirms remediation, closes the finding, and updates the audit trail.</p>
              </div>
            )}
            {isClosed && (
              <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <Check size={14} className="text-green-500" /><span className="text-xs font-semibold text-green-700">Remediation validated and closed.</span>
              </div>
            )}
          </Panel>

          <Panel title="Comments & Discussion">
            <div className="space-y-4 mb-4">
              {rem.comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
              {rem.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 mt-0.5" style={{ width: 28, height: 28, background: "#1D4ED8" }}>{c.user.split(" ").map((w) => w[0]).join("")}</div>
                  <div className="flex-1 rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-slate-900">{c.user}</span><span className="text-[10px] text-slate-400">{c.time}</span></div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0" style={{ width: 28, height: 28, background: "#065F46" }}>TS</div>
              <div className="flex-1 rounded-xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-3 text-xs text-slate-700 outline-none resize-none placeholder-slate-400" rows={3} placeholder="Add a comment or update..." style={{ background: "#FAFBFC" }} />
                <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <Paperclip size={14} className="text-slate-400" />
                  <button disabled={!comment.trim()} onClick={() => { addComment(rem.id, comment, "Tanmay Singh"); setComment(""); }} className="rounded-md px-3 py-1 text-xs font-semibold text-white transition-all" style={{ background: comment.trim() ? "#2563EB" : "#CBD5E1", cursor: comment.trim() ? "pointer" : "not-allowed" }}>Post</button>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="col-span-4 space-y-5">
          <Panel title="Task Details">
            {vuln && <MetaRow label="Finding" value={vuln.cve} mono />}
            {vuln && <MetaRow label="CVSS Score" value={String(vuln.cvss)} color="#DC2626" />}
            <MetaRow label="Status" value={rem.status} color="#1D4ED8" />
            <MetaRow label="Target Date" value={formatDate(rem.targetDate)} />
            <MetaRow label="Opened" value={formatDate(rem.opened)} />
            <MetaRow label="Owner" value={rem.owner} />
          </Panel>

          <Panel title="Ownership">
            <MetaRow label="Business Unit" value={asset?.businessUnit ?? "—"} />
            <MetaRow label="Application" value={application?.name ?? "—"} />
            <MetaRow label="Asset" value={asset?.name ?? vuln?.assetId ?? "—"} mono />
            <MetaRow label="Environment" value={vuln?.environment ?? "—"} color="#DC2626" />
          </Panel>

          {(rem.changeRequest || rem.incident) && (
            <Panel title="Related Items">
              {rem.changeRequest && <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "#F1F5F9" }}><div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Change Request</div><div className="text-xs font-semibold font-mono mt-0.5 text-blue-600">{rem.changeRequest}</div></div><ChevronRight size={13} className="text-slate-300" /></div>}
              {rem.incident && <div className="flex items-center justify-between py-2.5"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Incident</div><div className="text-xs font-semibold font-mono mt-0.5 text-violet-600">{rem.incident}</div></div><ChevronRight size={13} className="text-slate-300" /></div>}
            </Panel>
          )}

          {vuln && <Link href={`/vulnerabilities/${vuln.id}`} className="block text-center text-xs text-blue-600 font-medium hover:text-blue-700">View full vulnerability detail →</Link>}
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
