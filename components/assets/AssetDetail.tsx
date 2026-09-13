"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Server, AppWindow, Globe, Database, Shield, Radio, Box, Cloud, MapPin, Activity as ActivityIcon } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { AssetType } from "@/types/asset";
import { SeverityBadge, StatusBadge, CvssBadge, FindingTypeBadge } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";
import { getAssetFindings, getAssetSecurityPosture, getApplicationAssets, getAssetRelationshipsFor } from "@/lib/business/asset-posture";
import { calculateAge } from "@/lib/business/sla";
import { formatDate, initials, ownerColor } from "@/lib/business/format";
import { calculateAuditStatus, getAuditHistory } from "@/lib/business/audits";

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  Server: <Server size={15} />, Application: <AppWindow size={15} />, "Web Server": <Globe size={15} />,
  Database: <Database size={15} />, "API Gateway": <Shield size={15} />, "Auth Service": <Shield size={15} />,
  Endpoint: <Radio size={15} />, "Network Device": <Radio size={15} />, Container: <Box size={15} />, "Cloud Asset": <Cloud size={15} />,
};

type Tab = "overview" | "posture" | "vulnerabilities" | "applications" | "dependencies" | "relationships" | "activity";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "posture", label: "Security Posture" },
  { id: "vulnerabilities", label: "Vulnerabilities" },
  { id: "applications", label: "Applications" },
  { id: "dependencies", label: "Dependencies" },
  { id: "relationships", label: "Relationships" },
  { id: "activity", label: "Activity" },
];

function MetaRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-right ${mono ? "font-mono" : ""}`} style={{ color: color ?? "#0F172A" }}>{value}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9" }}>
        {icon && <span className="text-slate-400">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function AssetDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getApplication, applications, apis, cloudAssets, assetRelationships, assets, vulnerabilities, exceptions, activities, getAsset, audits, auditScopes, auditFindings } = useData();
  const [tab, setTab] = useState<Tab>("overview");
  const asset = getAsset(id);

  if (!asset) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Asset not found.</p></div>;
  }

  const application = getApplication(asset.applicationId);
  const assetVulns = getAssetFindings(asset.id, vulnerabilities, asset.applicationId);
  const exceptionCount = exceptions.filter((e) => assetVulns.some((v) => v.id === e.vulnerabilityId)).length;
  const posture = getAssetSecurityPosture(assetVulns, exceptionCount);
  const appAssets = application ? getApplicationAssets(application.id, { assets, apis, cloudAssets, relationships: assetRelationships, applications }) : null;
  const scaPackages = Array.from(
    new Map(
      vulnerabilities.filter((v) => v.applicationId === asset.applicationId && v.findingType === "SCA" && v.packageName).map((v) => [`${v.packageName}@${v.packageVersion}`, v])
    ).values()
  );
  const relationships = getAssetRelationshipsFor("ASSET", asset.id, assetRelationships);
  const assetActivities = activities.filter((a) => a.entity === asset.name);
  const auditHistory = getAuditHistory(asset.id, audits, auditScopes, auditFindings);
  const lastCompletedAudit = auditHistory.filter((h) => h.audit.status === "Completed" && h.audit.actualEndDate).sort((a, b) => new Date(b.audit.actualEndDate!).getTime() - new Date(a.audit.actualEndDate!).getTime())[0];
  const nextUpcomingAudit = auditHistory.filter((h) => h.audit.status !== "Completed" && h.audit.status !== "Cancelled").sort((a, b) => new Date(a.audit.plannedStartDate).getTime() - new Date(b.audit.plannedStartDate).getTime())[0];
  const latestAudit = nextUpcomingAudit ?? lastCompletedAudit;

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <button onClick={() => router.push("/assets")} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={13} /> Back to Asset Inventory</button>

      <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <div className="flex items-center justify-center rounded-lg w-9 h-9 shrink-0" style={{ background: "#F1F5F9" }}><span className="text-slate-600">{TYPE_ICON[asset.type]}</span></div>
              <h1 className="text-xl font-bold text-slate-900 font-mono">{asset.name}</h1>
              <span className="text-sm text-slate-400">/</span>
              <span className="text-sm text-slate-500 font-medium">{asset.type}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{asset.criticality}</span>
              <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#FEF2F2", color: "#DC2626" }}>{asset.environment}</span>
              <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: asset.status === "Unmanaged" ? "#FFFBEB" : "#F0FDF4", color: asset.status === "Unmanaged" ? "#D97706" : "#16A34A" }}>{asset.status ?? "Active"}</span>
              {asset.internetFacing && <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#FFF7ED", color: "#EA580C" }}><Globe size={11} /> Internet-Facing</span>}
            </div>
            <p className="text-xs text-slate-500">{application?.name ?? "—"} · {asset.ip} · {asset.os} · Last seen: {formatDate(asset.lastSeen ?? asset.lastScan)}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Risk Score</div>
            <div className="text-3xl font-bold font-heading" style={{ color: posture.riskScore >= 90 ? "#DC2626" : posture.riskScore >= 70 ? "#EA580C" : "#D97706" }}>{posture.riskScore}</div>
            <div className="text-[10px] text-slate-400">/ 100</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          {[{ label: "Critical", val: posture.critical, color: "#DC2626", bg: "#FEF2F2" }, { label: "High", val: posture.high, color: "#EA580C", bg: "#FFF7ED" }, { label: "Medium", val: posture.medium, color: "#D97706", bg: "#FFFBEB" }, { label: "Low", val: posture.low, color: "#16A34A", bg: "#F0FDF4" }].map((s) => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</div>
              <div className="text-2xl font-bold text-slate-900 font-heading">{s.val}</div>
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
          <div className="col-span-8">
            <SectionCard title="Asset Details">
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <MetaRow label="Asset ID" value={asset.id} mono />
                  <MetaRow label="Hostname" value={asset.hostname ?? "—"} mono />
                  <MetaRow label="IP Address" value={asset.ip} mono />
                  <MetaRow label="FQDN" value={asset.fqdn ?? "—"} mono />
                  <MetaRow label="Owner" value={asset.owner || "Unassigned"} />
                  <MetaRow label="Business Unit" value={asset.businessUnit} />
                </div>
                <div>
                  <MetaRow label="Discovery Source" value={asset.discoverySource ?? "—"} />
                  <MetaRow label="First Seen" value={formatDate(asset.firstSeen)} />
                  <MetaRow label="Last Seen" value={formatDate(asset.lastSeen ?? asset.lastScan)} />
                  <MetaRow label="Operating System" value={asset.os} />
                  <MetaRow label="Cloud Provider" value={asset.cloudProvider || "—"} />
                  {asset.cloudProvider && <MetaRow label="Cloud Account / Region" value={`${asset.cloudAccount ?? "—"} / ${asset.region ?? "—"}`} />}
                </div>
              </div>
            </SectionCard>
          </div>
          <div className="col-span-4 space-y-4">
            <SectionCard title="Location" icon={<MapPin size={14} />}>
              <MetaRow label="Location" value={asset.location ?? "—"} />
              <MetaRow label="Application" value={application?.name ?? "—"} />
              <MetaRow label="Business Service" value={asset.businessService ?? asset.businessUnit} />
            </SectionCard>
            {asset.description && (
              <SectionCard title="Description">
                <p className="text-xs text-slate-600 leading-relaxed">{asset.description}</p>
              </SectionCard>
            )}
            <SectionCard title="Audit History" icon={<ActivityIcon size={14} />}>
              {latestAudit ? (
                <>
                  <MetaRow label="Last Audit" value={lastCompletedAudit?.audit.actualEndDate ? formatDate(lastCompletedAudit.audit.actualEndDate) : "—"} />
                  <MetaRow label="Audit Type" value={latestAudit.audit.auditType} />
                  <MetaRow label="Result" value={lastCompletedAudit ? (lastCompletedAudit.audit.criticalFindings + lastCompletedAudit.audit.highFindings > 0 ? "Needs Improvement" : "Satisfactory") : "—"} />
                  <MetaRow label="Open Findings" value={String(latestAudit.openFindings)} color={latestAudit.openFindings > 0 ? "#DC2626" : undefined} />
                  <MetaRow label="Next Audit" value={nextUpcomingAudit ? formatDate(nextUpcomingAudit.audit.plannedStartDate) : lastCompletedAudit?.audit.nextAuditDate ? formatDate(lastCompletedAudit.audit.nextAuditDate) : "—"} />
                  <MetaRow label="Status" value={calculateAuditStatus(latestAudit.audit)} />
                  <Link href={`/audits/${latestAudit.audit.id}`} className="inline-block mt-2 text-xs text-blue-600 font-medium">View audit →</Link>
                </>
              ) : (
                <p className="text-xs text-slate-400">No audits recorded for this asset yet.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "posture" && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 space-y-5">
            <SectionCard title="Security Posture" icon={<Shield size={15} />}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Overall Risk Score</div>
                  <div className="text-4xl font-bold font-heading" style={{ color: posture.riskScore >= 90 ? "#DC2626" : posture.riskScore >= 70 ? "#EA580C" : "#D97706" }}>{posture.riskScore} <span className="text-sm text-slate-400 font-normal">/ 100</span></div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[{ label: "Critical", val: posture.critical, color: "#DC2626" }, { label: "High", val: posture.high, color: "#EA580C" }, { label: "Medium", val: posture.medium, color: "#D97706" }, { label: "Low", val: posture.low, color: "#16A34A" }].map((s) => (
                  <div key={s.label} className="rounded-lg p-3" style={{ background: `${s.color}0D`, border: `1px solid ${s.color}22` }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</div>
                    <div className="text-xl font-bold" style={{ color: "#0F172A" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Finding Type">
              <div className="grid grid-cols-4 gap-3">
                {(Object.entries(posture.byType) as [string, number][]).map(([type, count]) => (
                  <div key={type} className="rounded-lg p-3 text-center" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <FindingTypeBadge type={type as any} />
                    <div className="text-xl font-bold text-slate-900 mt-2">{count}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
          <div className="col-span-4 space-y-4">
            <SectionCard title="SLA">
              <MetaRow label="Critical/High SLA breached" value={String(posture.overdue)} color={posture.overdue > 0 ? "#DC2626" : undefined} />
              <MetaRow label="Open findings" value={String(posture.open)} />
              <MetaRow label="Exceptions" value={String(posture.exceptions)} />
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "vulnerabilities" && (
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}><h3 className="text-sm font-semibold text-slate-900">Vulnerabilities ({assetVulns.length})</h3></div>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["CVE", "Title", "Type", "Severity", "CVSS", "Status", "Age"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
            <tbody>
              {assetVulns.map((v, i) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderBottom: i < assetVulns.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/vulnerabilities/${v.id}`)}>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-blue-700">{v.cve}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-700 max-w-[220px] truncate block">{v.title}</span></td>
                  <td className="px-4 py-3"><FindingTypeBadge type={v.findingType} /></td>
                  <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                  <td className="px-4 py-3"><CvssBadge cvss={v.cvss} /></td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold ${calculateAge(v.firstSeen, new Date("2026-09-13")) > 30 ? "text-red-600" : "text-slate-700"}`}>{calculateAge(v.firstSeen, new Date("2026-09-13"))}d</span></td>
                </tr>
              ))}
              {assetVulns.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">No vulnerabilities recorded for this asset.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "applications" && (
        <SectionCard title="Applications" icon={<AppWindow size={15} />}>
          {application ? (
            <div className="flex items-center justify-between rounded-lg p-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div>
                <Link href={`/applications/${application.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-800">{application.name}</Link>
                <div className="text-xs text-slate-500 mt-0.5">{application.businessUnit} · Owner: {application.owner}</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{application.criticality}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">This asset is not associated with an application.</p>
          )}
        </SectionCard>
      )}

      {tab === "dependencies" && (
        <SectionCard title="Dependencies" icon={<Box size={15} />}>
          <p className="text-xs text-slate-500 mb-3">Open-source and third-party packages used by {application?.name ?? "this asset's application"} (SCA).</p>
          {scaPackages.length === 0 ? (
            <p className="text-xs text-slate-400">No dependency findings recorded.</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9" }}>{["Package", "Version", "Ecosystem", "Severity", "CVE", "Status"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {scaPackages.map((v) => (
                  <tr key={`${v.packageName}@${v.packageVersion}`} className="hover:bg-slate-50" style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-800 cursor-pointer" onClick={() => router.push(`/vulnerabilities/${v.id}`)}>{v.packageName}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{v.packageVersion}</td>
                    <td className="px-3 py-2.5 text-slate-500">{v.ecosystem}</td>
                    <td className="px-3 py-2.5"><SeverityBadge severity={v.severity} /></td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{v.cve}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      {tab === "relationships" && (
        <SectionCard title="Relationships" icon={<Shield size={15} />}>
          {relationships.length === 0 ? (
            <p className="text-xs text-slate-400">No relationships recorded for this asset. <Link href="/relationships" className="text-blue-600">Open Relationship Explorer →</Link></p>
          ) : (
            <div className="space-y-2">
              {relationships.map((r) => {
                const isSource = r.sourceId === asset.id;
                const other = isSource ? { type: r.targetType, name: r.targetName } : { type: r.sourceType, name: r.sourceName };
                return (
                  <div key={r.id} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <span className="font-semibold text-slate-900">{asset.name}</span>
                    <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: "#EFF6FF", color: "#2563EB" }}>{isSource ? r.relationshipType : `← ${r.relationshipType}`}</span>
                    <span className="text-slate-600">{other.name}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">{other.type}</span>
                  </div>
                );
              })}
              <Link href="/relationships" className="inline-block mt-2 text-xs text-blue-600 font-medium">Open full Relationship Explorer →</Link>
            </div>
          )}
        </SectionCard>
      )}

      {tab === "activity" && (
        <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <div className="px-5 py-3.5 border-b text-sm font-semibold text-slate-900 flex items-center gap-2" style={{ borderColor: "#F1F5F9" }}><ActivityIcon size={15} className="text-slate-400" /> Activity — {asset.name}</div>
          <div className="px-5 py-4 divide-y" style={{ borderColor: "#F1F5F9" }}>
            {assetActivities.length === 0 && <p className="text-xs text-slate-400">No activity recorded for this asset yet.</p>}
            {assetActivities.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0" style={{ width: 26, height: 26, background: evt.user === "System" ? "#94A3B8" : ownerColor(evt.user) }}>{initials(evt.user)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs"><span className="font-semibold text-slate-800">{evt.user}</span> <span className="text-slate-500">{evt.detail ?? evt.action.replace(/_/g, " ")}</span></div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{evt.timestamp.replace("T", " · ")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
