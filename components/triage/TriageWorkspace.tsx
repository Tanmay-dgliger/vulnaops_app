"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitMerge, Layers, Eye, CheckCircle2, AlertTriangle, XCircle, Info,
  ChevronDown, ChevronRight, AlertCircle, Shield, Globe, Zap, Database, Check, ArrowRight, ArrowLeft,
} from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { BusinessCriticality, DataSensitivity } from "@/types/vulnerability";
import type { TriageDisposition } from "@/lib/state/DataContext";
import { findDuplicates } from "@/lib/business/duplicates";
import { calculateRiskScore } from "@/lib/business/risk-score";

type FpAssessment = "none" | "potential" | "confirmed";
type YesNo = "yes" | "no";

const SEVERITY_DOT: Record<string, string> = { Critical: "#DC2626", High: "#EA580C", Medium: "#D97706", Low: "#16A34A" };
const CRIT_COLORS: Record<BusinessCriticality, string> = { Critical: "#DC2626", High: "#EA580C", Medium: "#D97706", Low: "#16A34A" };
const SENS_COLORS: Record<DataSensitivity, string> = { High: "#DC2626", Medium: "#D97706", Low: "#16A34A" };

const DISPOSITION_CFG: Record<TriageDisposition, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  remediate: { label: "Remediate", color: "#2563EB", bg: "#EFF6FF", icon: <CheckCircle2 size={14} />, desc: "Assign for patching and track to closure" },
  accept: { label: "Accept Risk", color: "#D97706", bg: "#FFFBEB", icon: <AlertTriangle size={14} />, desc: "Document accepted risk with expiry date" },
  "false-positive": { label: "False Positive", color: "#64748B", bg: "#F8FAFC", icon: <XCircle size={14} />, desc: "Mark as invalid finding and suppress" },
  compensating: { label: "Compensating Control", color: "#7C3AED", bg: "#F5F3FF", icon: <Shield size={14} />, desc: "Apply interim control and document rationale" },
};

function RadioOption<T extends string>({ value, current, onChange, label, sub, accent }: { value: T; current: T; onChange: (v: T) => void; label: string; sub?: string; accent?: string }) {
  const active = value === current;
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all" style={{ border: `1px solid ${active ? (accent ?? "#2563EB") : "#E2E8F0"}`, background: active ? `${accent ?? "#2563EB"}0D` : "#FAFBFC" }}>
      <div className="mt-0.5 shrink-0 flex items-center justify-center rounded-full" style={{ width: 16, height: 16, border: `2px solid ${active ? (accent ?? "#2563EB") : "#CBD5E1"}`, background: active ? (accent ?? "#2563EB") : "transparent" }}>
        {active && <span className="w-2 h-2 rounded-full bg-white inline-block" />}
      </div>
      <input type="radio" className="sr-only" checked={active} onChange={() => onChange(value)} />
      <div><div className="text-xs font-semibold" style={{ color: active ? (accent ?? "#2563EB") : "#334155" }}>{label}</div>{sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}</div>
    </label>
  );
}

function SelectGroup<T extends string>({ label, options, value, onChange, colors }: { label: string; options: T[]; value: T; onChange: (v: T) => void; colors?: Record<string, string> }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => {
          const active = opt === value;
          const color = colors?.[opt] ?? "#2563EB";
          return (
            <button key={opt} onClick={() => onChange(opt)} className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all" style={{ background: active ? `${color}15` : "#F8FAFC", color: active ? color : "#64748B", border: `1px solid ${active ? `${color}44` : "#E2E8F0"}` }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionPanel({ title, icon, accent, children }: { title: string; icon: React.ReactNode; accent?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
        <span style={{ color: accent ?? "#64748B" }}>{icon}</span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function AuditRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold" style={{ color: color ?? "#0F172A" }}>{value}</span>
    </div>
  );
}

export default function TriageWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const { getVulnerability, getAsset, vulnerabilities, users, mergeDuplicate, keepSeparate, completeTriage } = useData();
  const vuln = getVulnerability(id);

  const [fpAssessment, setFpAssessment] = useState<FpAssessment>(vuln?.status === "Potential False Positive" ? "potential" : "none");
  const [criticality, setCriticality] = useState<BusinessCriticality>(vuln?.businessCriticality ?? "Medium");
  const [internetExposed, setInternetExposed] = useState<YesNo>(vuln?.internetExposed ? "yes" : "no");
  const [exploitAvailable, setExploitAvailable] = useState<YesNo>(vuln?.exploitAvailable ? "yes" : "no");
  const [sensitivity, setSensitivity] = useState<DataSensitivity>(vuln?.dataSensitivity ?? "Medium");
  const [disposition, setDisposition] = useState<TriageDisposition>("remediate");
  const [owner, setOwner] = useState(vuln?.owner ?? "");
  const [duplicateAction, setDuplicateAction] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const duplicate = useMemo(() => (vuln ? findDuplicates(vuln, vulnerabilities) : null), [vuln, vulnerabilities]);
  const asset = vuln ? getAsset(vuln.assetId) : undefined;
  const computedRisk = vuln ? calculateRiskScore(vuln.cvss, criticality, internetExposed === "yes", exploitAvailable === "yes", sensitivity) : 0;
  const dcfg = DISPOSITION_CFG[disposition];

  if (!vuln) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Vulnerability not found.</p></div>;
  }

  const handleMerge = () => {
    if (!duplicate) return;
    setDuplicateAction("merge");
    mergeDuplicate(vuln.id, duplicate.candidate.id);
  };
  const handleKeepSeparate = () => {
    setDuplicateAction("separate");
    keepSeparate(vuln.id);
  };

  const handleSubmit = () => {
    completeTriage({
      vulnerabilityId: vuln.id,
      fpAssessment,
      criticality,
      internetExposed: internetExposed === "yes",
      exploitAvailable: exploitAvailable === "yes",
      dataSensitivity: sensitivity,
      disposition,
      owner,
    });
    setShowAudit(true);
    setTimeout(() => setSubmitted(true), 350);
  };

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: "#F0FDF4" }}>
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1 font-heading">Triage Complete</h2>
          <p className="text-sm text-slate-500 mb-4">{vuln.cve} on {vuln.assetId} has been triaged and assigned for <strong>{DISPOSITION_CFG[disposition].label}</strong>.</p>
          <button onClick={() => router.push(`/vulnerabilities/${vuln.id}`)} className="text-xs text-blue-600 font-medium hover:text-blue-700">← Back to vulnerability detail</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1360px] mx-auto space-y-4">
      <button onClick={() => router.push(`/vulnerabilities/${vuln.id}`)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={13} /> Back to Vulnerability Detail
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Vulnerability Triage</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review, assess and disposition a new finding before it enters the remediation workflow</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 rounded-lg px-3 py-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <AlertTriangle size={13} className="text-amber-500" />
          <span className="font-medium text-amber-700">{vuln.status} finding — action required</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        <div className="col-span-5 space-y-4">
          <SectionPanel title="Finding Details" icon={<AlertCircle size={15} />} accent={SEVERITY_DOT[vuln.severity]}>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-base font-bold text-slate-900">{vuln.cve}</span>
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold" style={{ background: `${SEVERITY_DOT[vuln.severity]}14`, color: SEVERITY_DOT[vuln.severity], border: `1px solid ${SEVERITY_DOT[vuln.severity]}44` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_DOT[vuln.severity] }} /> {vuln.severity}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
              {[
                { label: "Asset", value: asset?.name ?? vuln.assetId, mono: true },
                { label: "CVSS", value: String(vuln.cvss), color: SEVERITY_DOT[vuln.severity] },
                { label: "Scanner", value: vuln.scanner },
                { label: "Port", value: String(vuln.port ?? "—"), mono: true },
                { label: "Protocol", value: vuln.protocol ?? "—" },
                { label: "Plugin", value: vuln.pluginId, mono: true },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</div>
                  <div className={`text-xs font-semibold ${f.mono ? "font-mono" : ""}`} style={{ color: f.color ?? "#0F172A" }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-3" style={{ borderColor: "#F1F5F9" }}>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</div>
                <p className="text-xs text-slate-600 leading-relaxed">{vuln.description}</p>
              </div>
              {vuln.affectedComponent && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Affected Component</div>
                  <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#334155" }}>{vuln.affectedComponent}</div>
                </div>
              )}
            </div>
          </SectionPanel>

          <SectionPanel title="Detection Evidence" icon={<Eye size={15} />} accent="#2563EB">
            <div className="rounded-lg p-3 text-[11px] font-mono text-slate-600 leading-relaxed overflow-x-auto" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div className="text-slate-400 mb-1"># {vuln.scanner} scan output — {vuln.lastSeen}</div>
              <div><span className="text-blue-600">Plugin:</span> {vuln.pluginId}</div>
              <div><span className="text-blue-600">Host:</span> {asset?.name} ({asset?.ip})</div>
              <div><span className="text-blue-600">Port:</span> {vuln.port}/{vuln.protocol}</div>
              <div><span className="text-red-500">VULN:</span> {vuln.cve} confirmed present</div>
              <div><span className="text-blue-600">CVSS3:</span> {vuln.cvss}</div>
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {vuln.internetExposed && <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: "#EA580C0D", color: "#EA580C", border: "1px solid #EA580C22" }}><Globe size={11} /> Internet Exposed</div>}
              {vuln.exploitAvailable && <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: "#DC26260D", color: "#DC2626", border: "1px solid #DC262622" }}><Zap size={11} /> Active Exploit</div>}
              <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: "#7C3AED0D", color: "#7C3AED", border: "1px solid #7C3AED22" }}><Database size={11} /> {vuln.environment}</div>
            </div>
          </SectionPanel>
        </div>

        <div className="col-span-7 space-y-4">
          {duplicate && (
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #FDE68A" }}>
              <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
                <Layers size={15} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-amber-800">Duplicate Assessment</h3>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#FEF08A", color: "#92400E" }}>Potential Duplicate Detected</span>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-3">A finding with the same CVE, asset, port and protocol was detected in an earlier scan. Review and decide whether to merge.</p>
                <div className="rounded-lg p-3 mb-4" style={{ background: "#FAFBFC", border: "1px solid #E2E8F0" }}>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {[{ label: "CVE", value: vuln.cve }, { label: "Asset", value: asset?.name ?? vuln.assetId }, { label: "Port", value: `${vuln.port}/${vuln.protocol}` }].map((f) => (
                      <div key={f.label}><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</div><div className="font-mono text-xs font-semibold text-slate-900">{f.value}</div></div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}><div className="h-full rounded-full" style={{ width: `${duplicate.confidence}%`, background: "linear-gradient(90deg, #D97706, #16A34A)" }} /></div>
                    <span className="text-xs font-bold text-green-600 shrink-0">{duplicate.confidence}% match</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Matched on: {duplicate.matchedOn.join(" · ")}</div>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: "merge", label: "Merge Findings", icon: <GitMerge size={13} />, color: "#2563EB", bg: "#EFF6FF", onClick: handleMerge },
                    { id: "separate", label: "Keep Separate", icon: <Layers size={13} />, color: "#64748B", bg: "#F8FAFC", onClick: handleKeepSeparate },
                    { id: "review", label: "Review", icon: <Eye size={13} />, color: "#7C3AED", bg: "#F5F3FF", onClick: () => setDuplicateAction("review") },
                  ].map((btn) => (
                    <button key={btn.id} onClick={btn.onClick} disabled={vuln.isDuplicate} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all disabled:opacity-50"
                      style={{ background: duplicateAction === btn.id ? btn.bg : "#FAFBFC", color: duplicateAction === btn.id ? btn.color : "#64748B", border: `1px solid ${duplicateAction === btn.id ? btn.color + "44" : "#E2E8F0"}` }}>
                      {btn.icon} {btn.label}{duplicateAction === btn.id && <Check size={11} />}
                    </button>
                  ))}
                </div>
                {vuln.isDuplicate && <p className="text-[11px] text-green-600 font-medium mt-2">This finding has been merged into {vuln.parentFindingId}.</p>}
              </div>
            </div>
          )}

          <SectionPanel title="False Positive Assessment" icon={<XCircle size={15} />} accent="#64748B">
            <div className="space-y-2">
              <RadioOption<FpAssessment> value="none" current={fpAssessment} onChange={setFpAssessment} label="Not a false positive" sub="Finding is genuine — proceed with remediation or risk disposition" accent="#16A34A" />
              <RadioOption<FpAssessment> value="potential" current={fpAssessment} onChange={setFpAssessment} label="Potential false positive" sub="Uncertain — requires additional investigation or verification" accent="#D97706" />
              <RadioOption<FpAssessment> value="confirmed" current={fpAssessment} onChange={setFpAssessment} label="Confirmed false positive" sub="Evidence confirms this is not a real vulnerability — suppress and audit" accent="#DC2626" />
            </div>
          </SectionPanel>

          <SectionPanel title="Risk Assessment" icon={<Shield size={15} />} accent="#7C3AED">
            <div className="space-y-4">
              <SelectGroup<BusinessCriticality> label="Business Criticality" options={["Critical", "High", "Medium", "Low"]} value={criticality} onChange={setCriticality} colors={CRIT_COLORS} />
              <div className="grid grid-cols-2 gap-4">
                <SelectGroup<YesNo> label="Internet Exposed" options={["yes", "no"]} value={internetExposed} onChange={setInternetExposed} colors={{ yes: "#DC2626", no: "#16A34A" }} />
                <SelectGroup<YesNo> label="Exploit Available" options={["yes", "no"]} value={exploitAvailable} onChange={setExploitAvailable} colors={{ yes: "#DC2626", no: "#16A34A" }} />
              </div>
              <SelectGroup<DataSensitivity> label="Data Sensitivity" options={["High", "Medium", "Low"]} value={sensitivity} onChange={setSensitivity} colors={SENS_COLORS} />
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <span className="text-xs font-medium text-slate-600">Computed Risk Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}><div className="h-full rounded-full" style={{ width: `${computedRisk}%`, background: "#DC2626" }} /></div>
                  <span className="text-sm font-bold text-red-600">{computedRisk} / 100</span>
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Assign Owner" icon={<Shield size={15} />} accent="#2563EB">
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A" }}>
              <option value="">Unassigned</option>
              {users.filter((u) => u.role !== "CISO").map((u) => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
            </select>
          </SectionPanel>

          <SectionPanel title="Recommended Disposition" icon={<ArrowRight size={15} />} accent="#2563EB">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.entries(DISPOSITION_CFG) as [TriageDisposition, typeof dcfg][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setDisposition(key)} className="flex items-start gap-2.5 p-3 rounded-lg text-left transition-all" style={{ background: disposition === key ? cfg.bg : "#FAFBFC", border: `1px solid ${disposition === key ? cfg.color + "44" : "#E2E8F0"}` }}>
                  <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full shrink-0" style={{ background: disposition === key ? cfg.bg : "#F1F5F9" }}><span style={{ color: disposition === key ? cfg.color : "#94A3B8" }}>{cfg.icon}</span></div>
                  <div><div className="text-xs font-semibold" style={{ color: disposition === key ? cfg.color : "#334155" }}>{cfg.label}</div><div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{cfg.desc}</div></div>
                  {disposition === key && <Check size={13} className="ml-auto shrink-0 mt-0.5" style={{ color: cfg.color }} />}
                </button>
              ))}
            </div>

            <div className="rounded-lg border mb-4 overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowAudit((v) => !v)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors" style={{ background: "#FAFBFC" }}>
                <span className="flex items-center gap-1.5"><Info size={13} className="text-slate-400" />Audit Summary — Review before submitting</span>
                {showAudit ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
              </button>
              {showAudit && (
                <div className="px-4 py-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                  <AuditRow label="CVE" value={vuln.cve} />
                  <AuditRow label="Asset" value={`${asset?.name ?? vuln.assetId} (${vuln.environment})`} />
                  <AuditRow label="Severity" value={`${vuln.severity} — CVSS ${vuln.cvss}`} color={SEVERITY_DOT[vuln.severity]} />
                  <AuditRow label="False Positive Assessment" value={fpAssessment === "none" ? "Not a false positive" : fpAssessment === "potential" ? "Potential false positive" : "Confirmed false positive"} color={fpAssessment === "none" ? "#16A34A" : fpAssessment === "potential" ? "#D97706" : "#DC2626"} />
                  <AuditRow label="Duplicate Decision" value={duplicateAction ?? (duplicate ? "Not reviewed" : "No duplicate detected")} color={duplicateAction ? "#0F172A" : "#D97706"} />
                  <AuditRow label="Business Criticality" value={criticality} color={CRIT_COLORS[criticality]} />
                  <AuditRow label="Internet Exposed" value={internetExposed === "yes" ? "Yes" : "No"} color={internetExposed === "yes" ? "#DC2626" : "#16A34A"} />
                  <AuditRow label="Exploit Available" value={exploitAvailable === "yes" ? "Yes" : "No"} color={exploitAvailable === "yes" ? "#DC2626" : "#16A34A"} />
                  <AuditRow label="Data Sensitivity" value={sensitivity} color={SENS_COLORS[sensitivity]} />
                  <AuditRow label="Disposition" value={DISPOSITION_CFG[disposition].label} color={DISPOSITION_CFG[disposition].color} />
                  <AuditRow label="Assigned Owner" value={owner || "Unassigned"} />
                  <AuditRow label="Triaged By" value="Tanmay Singh — Security Administrator" />
                </div>
              )}
            </div>

            <button onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99]" style={{ background: dcfg.color, boxShadow: `0 2px 12px ${dcfg.color}40` }}>
              <CheckCircle2 size={16} /> Complete Triage — {dcfg.label}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">This action will be recorded in the audit trail.</p>
          </SectionPanel>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
