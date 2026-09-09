"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, AppWindow, Server } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { SeverityBadge, StatusBadge, CvssBadge } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";

export default function ApplicationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getApplication, assets, vulnerabilities } = useData();
  const app = getApplication(id);

  if (!app) {
    return <div className="p-6 max-w-[1360px] mx-auto"><p className="text-sm text-slate-500">Application not found.</p></div>;
  }

  const appAssets = assets.filter((a) => a.applicationId === app.id);
  const appVulns = vulnerabilities.filter((v) => v.applicationId === app.id);
  const open = appVulns.filter(isOpen);
  const critical = open.filter((v) => v.severity === "Critical").length;
  const high = open.filter((v) => v.severity === "High").length;
  const medium = open.filter((v) => v.severity === "Medium").length;
  const low = open.filter((v) => v.severity === "Low").length;
  const riskScore = open.length ? Math.max(...open.map((v) => v.riskScore)) : 0;

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      <button onClick={() => router.push("/applications")} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft size={13} /> Back to Applications</button>

      <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <div className="flex items-center justify-center rounded-lg w-9 h-9 shrink-0" style={{ background: "#F1F5F9" }}><AppWindow size={16} className="text-slate-600" /></div>
              <h1 className="text-xl font-bold text-slate-900 font-heading">{app.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{app.criticality}</span>
            </div>
            <p className="text-xs text-slate-500">{app.businessUnit} · Owner: {app.owner} · {appAssets.length} associated assets</p>
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
        <div className="col-span-7">
          <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}><h3 className="text-sm font-semibold text-slate-900">Associated Assets ({appAssets.length})</h3></div>
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["Asset", "Type", "Environment", "Owner"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
              <tbody>
                {appAssets.map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderBottom: i < appAssets.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/assets/${a.id}`)}>
                    <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5"><Server size={12} className="text-slate-400" />{a.name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-500">{a.type}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-500">{a.environment}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-700">{a.owner}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-span-5">
          <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}><h3 className="text-sm font-semibold text-slate-900">Vulnerabilities ({appVulns.length})</h3></div>
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["CVE", "Severity", "CVSS", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
              <tbody>
                {appVulns.slice(0, 12).map((v, i) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderBottom: i < Math.min(appVulns.length, 12) - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/vulnerabilities/${v.id}`)}>
                    <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-blue-700">{v.cve}</span></td>
                    <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                    <td className="px-4 py-3"><CvssBadge cvss={v.cvss} /></td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
                {appVulns.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-400">No vulnerabilities recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
