"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, AppWindow } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { OwnerAvatar, RiskScoreBar } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";

const CRIT_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  High: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};

export default function ApplicationTable() {
  const router = useRouter();
  const { applications, assets, vulnerabilities } = useData();
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () =>
      applications.map((app) => {
        const appAssets = assets.filter((a) => a.applicationId === app.id);
        const appVulns = vulnerabilities.filter((v) => v.applicationId === app.id);
        const open = appVulns.filter(isOpen);
        const critical = open.filter((v) => v.severity === "Critical").length;
        const riskScore = open.length ? Math.max(...open.map((v) => v.riskScore)) : 0;
        return { app, assetCount: appAssets.length, openCount: open.length, critical, riskScore };
      }),
    [applications, assets, vulnerabilities]
  );

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.app.name.toLowerCase().includes(q) || r.app.owner.toLowerCase().includes(q) || r.app.businessUnit.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Application inventory with ownership and vulnerability exposure</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} applications</div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Application", "Business Unit", "Owner", "Criticality", "Assets", "Open Vulns", "Critical", "Risk Score", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => {
              const cc = CRIT_CFG[r.app.criticality];
              return (
                <tr key={r.app.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/applications/${r.app.id}`)}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 28, height: 28, background: "#F1F5F9", color: "#64748B" }}><AppWindow size={13} /></div><span className="text-xs font-bold text-slate-900">{r.app.name}</span></div></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{r.app.businessUnit}</span></td>
                  <td className="px-4 py-3"><OwnerAvatar name={r.app.owner} /></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cc.text }} />{r.app.criticality}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-slate-700">{r.assetCount}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-slate-700">{r.openCount}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold" style={{ background: "#FEF2F2", color: "#DC2626" }}>{r.critical}</span></td>
                  <td className="px-4 py-3"><RiskScoreBar score={r.riskScore} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="h-4" />
    </div>
  );
}
