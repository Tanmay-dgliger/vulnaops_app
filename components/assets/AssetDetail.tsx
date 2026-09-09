"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Server, AppWindow, Globe, Database, Shield } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { AssetType } from "@/types/asset";
import { SeverityBadge, StatusBadge, CvssBadge } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";
import { calculateAge } from "@/lib/business/sla";
import { formatDate } from "@/lib/business/format";

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  Server: <Server size={13} />, Application: <AppWindow size={13} />, "Web Server": <Globe size={13} />,
  Database: <Database size={13} />, "API Gateway": <Shield size={13} />, "Auth Service": <Shield size={13} />,
};

export default function AssetDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getAsset, getApplication, vulnerabilities } = useData();
  const asset = getAsset(id);

  if (!asset) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Asset not found.</p></div>;
  }

  const application = getApplication(asset.applicationId);
  const assetVulns = vulnerabilities.filter((v) => v.assetId === asset.id);
  const open = assetVulns.filter(isOpen);
  const critical = open.filter((v) => v.severity === "Critical").length;
  const high = open.filter((v) => v.severity === "High").length;
  const medium = open.filter((v) => v.severity === "Medium").length;
  const low = open.filter((v) => v.severity === "Low").length;
  const riskScore = open.length ? Math.max(...open.map((v) => v.riskScore)) : 0;

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
            </div>
            <p className="text-xs text-slate-500">{application?.name} · {asset.ip} · {asset.os} · Last scanned: {formatDate(asset.lastScan)}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Risk Score</div>
            <div className="text-3xl font-bold font-heading" style={{ color: riskScore >= 90 ? "#DC2626" : riskScore >= 70 ? "#EA580C" : "#D97706" }}>{riskScore}</div>
            <div className="text-[10px] text-slate-400">/ 100</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          {[{ label: "Critical", val: critical, color: "#DC2626", bg: "#FEF2F2" }, { label: "High", val: high, color: "#EA580C", bg: "#FFF7ED" }, { label: "Medium", val: medium, color: "#D97706", bg: "#FFFBEB" }, { label: "Low", val: low, color: "#16A34A", bg: "#F0FDF4" }].map((s) => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</div>
              <div className="text-2xl font-bold text-slate-900 font-heading">{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8">
          <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}><h3 className="text-sm font-semibold text-slate-900">Vulnerabilities ({assetVulns.length})</h3></div>
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["CVE", "Title", "Severity", "CVSS", "Status", "Age"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
              <tbody>
                {assetVulns.map((v, i) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderBottom: i < assetVulns.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/vulnerabilities/${v.id}`)}>
                    <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-blue-700">{v.cve}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-700 max-w-[220px] truncate block">{v.title}</span></td>
                    <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                    <td className="px-4 py-3"><CvssBadge cvss={v.cvss} /></td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${calculateAge(v.firstSeen, new Date("2026-09-09")) > 30 ? "text-red-600" : "text-slate-700"}`}>{calculateAge(v.firstSeen, new Date("2026-09-09"))}d</span></td>
                  </tr>
                ))}
                {assetVulns.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">No vulnerabilities recorded for this asset.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-span-4 space-y-4">
          <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-3.5 border-b text-sm font-semibold text-slate-900" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>Asset Details</div>
            <div className="px-5 py-4">
              {[
                { label: "Owner", value: asset.owner }, { label: "Business Unit", value: asset.businessUnit },
                { label: "Application", value: application?.name ?? "—" }, { label: "Environment", value: asset.environment, color: "#DC2626" },
                { label: "IP Address", value: asset.ip, mono: true }, { label: "OS", value: asset.os },
                { label: "Last Scan", value: formatDate(asset.lastScan) }, { label: "SLA Status", value: asset.slaStatus, color: asset.slaStatus === "Breached" ? "#DC2626" : asset.slaStatus === "Due Soon" ? "#D97706" : "#16A34A" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
                  <span className="text-xs text-slate-500 font-medium">{r.label}</span>
                  <span className={`text-xs font-semibold ${(r as any).mono ? "font-mono" : ""}`} style={{ color: r.color ?? "#0F172A" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
