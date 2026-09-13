"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus, User, Building2, AlertCircle, Clock } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { RemediationStatus } from "@/types/remediation";
import type { VulnerabilitySeverity, FindingType } from "@/types/vulnerability";
import { OwnerAvatar, SEVERITY_CFG, FindingTypeBadge, AuditFindingBadge } from "@/components/common/badges";
import { calculateSlaStatus } from "@/lib/business/sla";
import { initials, ownerColor } from "@/lib/business/format";

type GroupBy = "owner" | "bu" | "severity";

const COL_CFG: Record<RemediationStatus, { accent: string; bg: string }> = {
  New: { accent: "#64748B", bg: "#F8FAFC" },
  Assigned: { accent: "#D97706", bg: "#FFFBEB" },
  "In Progress": { accent: "#2563EB", bg: "#EFF6FF" },
  Validation: { accent: "#7C3AED", bg: "#F5F3FF" },
  Closed: { accent: "#16A34A", bg: "#F0FDF4" },
};
const COLUMNS: RemediationStatus[] = ["New", "Assigned", "In Progress", "Validation", "Closed"];

function RiskDot({ score }: { score: number }) {
  const color = score >= 90 ? "#DC2626" : score >= 70 ? "#EA580C" : score >= 50 ? "#D97706" : "#16A34A";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}><div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} /></div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

interface BoardCard {
  remId: string;
  refCode: string;
  title: string;
  severity: VulnerabilitySeverity;
  findingType: FindingType | "AUDIT";
  assetId: string;
  owner: string;
  status: RemediationStatus;
  progress: number;
  riskScore: number;
  slaLabel: string;
  slaBreached: boolean;
}

function KanbanCard({ card, onOpen }: { card: BoardCard; onOpen: () => void }) {
  const sc = SEVERITY_CFG[card.severity];
  const progressColor = card.progress >= 80 ? "#16A34A" : card.progress >= 40 ? "#2563EB" : "#D97706";
  return (
    <div onClick={onOpen} className="rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="h-0.5 rounded-t-xl" style={{ background: sc.dot }} />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div><div className="font-mono text-[11px] font-bold text-blue-700">{card.refCode}</div><div className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">{card.title}</div></div>
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: sc.dot }} />{card.severity.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {card.findingType === "AUDIT" ? <AuditFindingBadge /> : <FindingTypeBadge type={card.findingType} />}
          {card.assetId && <span className="font-mono text-[10px] font-semibold text-slate-700 rounded px-1.5 py-0.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>{card.assetId}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center rounded-full text-[8px] font-bold text-white shrink-0" style={{ width: 18, height: 18, background: ownerColor(card.owner) }}>{initials(card.owner)}</div>
          <span className="text-[11px] text-slate-600 truncate">{card.owner}</span>
        </div>
        {card.progress > 0 && card.progress < 100 && (
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Progress</span><span className="font-semibold" style={{ color: progressColor }}>{card.progress}%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}><div className="h-full rounded-full transition-all" style={{ width: `${card.progress}%`, background: progressColor }} /></div>
          </div>
        )}
        {card.progress === 100 && <div className="flex items-center gap-1 text-[10px] font-semibold text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Remediation complete</div>}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "#F8FAFC" }}>
          <span className="text-[10px] font-semibold" style={{ color: card.slaBreached ? "#DC2626" : "#64748B" }}>{card.slaBreached ? "⚠ " : ""}{card.slaLabel}</span>
          <RiskDot score={card.riskScore} />
        </div>
      </div>
    </div>
  );
}

export default function RemediationBoard({ initialStatus }: { initialStatus?: string } = {}) {
  const router = useRouter();
  const { remediations, vulnerabilities, auditFindings } = useData();
  const [filterSev, setFilterSev] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [statusFilter] = useState<string>(() => initialStatus ?? "");
  const [view, setView] = useState<"board" | "list">(() => (initialStatus ? "list" : "board"));

  const vulnById = useMemo(() => new Map(vulnerabilities.map((v) => [v.id, v])), [vulnerabilities]);
  const findingById = useMemo(() => new Map(auditFindings.map((f) => [f.id, f])), [auditFindings]);

  const cards: BoardCard[] = useMemo(
    () =>
      remediations
        .map((r) => {
          if (r.vulnerabilityId) {
            const vuln = vulnById.get(r.vulnerabilityId);
            if (!vuln) return null;
            const sla = calculateSlaStatus(vuln.severity, vuln.firstSeen, vuln.status);
            return {
              remId: r.id, refCode: vuln.cve, title: vuln.title, severity: vuln.severity, findingType: vuln.findingType,
              assetId: vuln.assetId, owner: r.owner, status: r.status, progress: r.progress, riskScore: vuln.riskScore,
              slaLabel: sla.label, slaBreached: sla.state === "Breached",
            } as BoardCard;
          }
          if (r.auditFindingId) {
            const finding = findingById.get(r.auditFindingId);
            if (!finding) return null;
            const sla = calculateSlaStatus(finding.severity, finding.createdDate, finding.status);
            return {
              remId: r.id, refCode: finding.id, title: finding.title, severity: finding.severity, findingType: "AUDIT",
              assetId: finding.assetId ?? "", owner: r.owner, status: r.status, progress: r.progress, riskScore: finding.riskScore,
              slaLabel: sla.label, slaBreached: sla.state === "Breached",
            } as BoardCard;
          }
          return null;
        })
        .filter((c): c is BoardCard => c !== null),
    [remediations, vulnById, findingById]
  );

  const filtered = cards.filter(
    (c) => (filterSev === "all" || c.severity === filterSev) && (filterType === "all" || c.findingType === filterType) && (!statusFilter || c.status === statusFilter)
  );

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Remediation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage vulnerability remediation across all teams</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
          {(["all", "Critical", "High", "Medium", "Low"] as const).map((sev) => (
            <button key={sev} onClick={() => setFilterSev(sev)} className="rounded-md px-2.5 py-1 text-xs font-medium transition-all" style={{ background: filterSev === sev ? "#FFFFFF" : "transparent", color: filterSev === sev ? "#0F172A" : "#64748B", boxShadow: filterSev === sev ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {sev === "all" ? "All" : sev}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
          {(["all", "VAPT", "SAST", "DAST", "SCA", "AUDIT"] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className="rounded-md px-2.5 py-1 text-xs font-medium transition-all" style={{ background: filterType === t ? "#FFFFFF" : "transparent", color: filterType === t ? "#0F172A" : "#64748B", boxShadow: filterType === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
          {(["board", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className="flex items-center justify-center rounded-md transition-all" style={{ width: 32, height: 28, background: view === v ? "#FFF" : "transparent" }}>
              {v === "board" ? <LayoutGrid size={14} className={view === v ? "text-slate-800" : "text-slate-400"} /> : <List size={14} className={view === v ? "text-slate-800" : "text-slate-400"} />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const cc = COL_CFG[col];
          const colCards = filtered.filter((c) => c.status === col);
          const breached = colCards.filter((c) => c.slaBreached).length;
          return (
            <div key={col} className="rounded-lg p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: cc.accent }}>{col}</div>
              <div className="text-2xl font-bold text-slate-900 font-heading">{colCards.length}</div>
              {breached > 0 && <div className="text-[10px] font-semibold text-red-500 mt-0.5">{breached} breached</div>}
            </div>
          );
        })}
      </div>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 320px)" }}>
          {COLUMNS.map((col) => {
            const cc = COL_CFG[col];
            const colCards = filtered.filter((c) => c.status === col);
            return (
              <div key={col} className="flex flex-col shrink-0" style={{ width: 260 }}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cc.accent }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cc.accent }}>{col}</span>
                  <span className="ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: cc.bg, color: cc.accent }}>{colCards.length}</span>
                </div>
                <div className="flex-1 rounded-xl p-2 space-y-2.5 overflow-y-auto" style={{ background: cc.bg, border: `1px solid ${cc.accent}22`, minHeight: 120 }}>
                  {colCards.map((card) => <KanbanCard key={card.remId} card={card} onOpen={() => router.push(`/remediation/${card.remId}`)} />)}
                  {colCards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-xs text-slate-400">No items</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>{["CVE", "Type", "Asset", "Owner", "Status", "Progress", "SLA", "Risk"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.remId} className="hover:bg-slate-50 cursor-pointer" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }} onClick={() => router.push(`/remediation/${c.remId}`)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{c.refCode}</td>
                  <td className="px-4 py-3">{c.findingType === "AUDIT" ? <AuditFindingBadge /> : <FindingTypeBadge type={c.findingType} />}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.assetId || "—"}</td>
                  <td className="px-4 py-3"><OwnerAvatar name={c.owner} /></td>
                  <td className="px-4 py-3"><span className="text-xs font-medium" style={{ color: COL_CFG[c.status].accent }}>{c.status}</span></td>
                  <td className="px-4 py-3 text-xs font-semibold">{c.progress}%</td>
                  <td className="px-4 py-3 text-xs" style={{ color: c.slaBreached ? "#DC2626" : "#64748B" }}>{c.slaLabel}</td>
                  <td className="px-4 py-3"><RiskDot score={c.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="h-4" />
    </div>
  );
}
