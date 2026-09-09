"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Server, AppWindow, Globe, Database, Shield } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { AssetType } from "@/types/asset";
import type { Environment } from "@/types/vulnerability";
import { OwnerAvatar, RiskScoreBar } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";

const CRIT_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  High: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};
const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  Server: <Server size={13} />, Application: <AppWindow size={13} />, "Web Server": <Globe size={13} />,
  Database: <Database size={13} />, "API Gateway": <Shield size={13} />, "Auth Service": <Shield size={13} />,
};

function SevChip({ count, color, bg }: { count: number; color: string; bg: string }) {
  return <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold tabular-nums min-w-[32px]" style={{ background: bg, color }}>{count}</span>;
}

export default function AssetTable() {
  const router = useRouter();
  const { assets, vulnerabilities } = useData();
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState<Environment | "all">("all");

  const rows = useMemo(
    () =>
      assets.map((a) => {
        const av = vulnerabilities.filter((v) => v.assetId === a.id && isOpen(v));
        return {
          asset: a,
          critical: av.filter((v) => v.severity === "Critical").length,
          high: av.filter((v) => v.severity === "High").length,
          medium: av.filter((v) => v.severity === "Medium").length,
          riskScore: av.length ? Math.max(...av.map((v) => v.riskScore)) : 0,
        };
      }),
    [assets, vulnerabilities]
  );

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.asset.name.toLowerCase().includes(q) || r.asset.owner.toLowerCase().includes(q) || r.asset.businessUnit.toLowerCase().includes(q);
    const matchEnv = envFilter === "all" || r.asset.environment === envFilter;
    return matchSearch && matchEnv;
  });

  const breachedCount = assets.filter((a) => a.slaStatus === "Breached").length;
  const dueSoonCount = assets.filter((a) => a.slaStatus === "Due Soon").length;

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Asset Risk</h1>
          <p className="text-sm text-slate-500 mt-0.5">Asset inventory with vulnerability context and risk posture</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="rounded-md px-3 py-1.5 font-medium" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{breachedCount} SLA Breached</div>
          <div className="rounded-md px-3 py-1.5 font-medium" style={{ background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>{dueSoonCount} Due Soon</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#F1F5F9" }}>
          {(["all", "Production", "Staging", "Development", "DR"] as const).map((env) => (
            <button key={env} onClick={() => setEnvFilter(env)} className="rounded-md px-2.5 py-1 text-xs font-medium transition-all" style={{ background: envFilter === env ? "#FFF" : "transparent", color: envFilter === env ? "#0F172A" : "#64748B" }}>
              {env === "all" ? "All Envs" : env}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} assets</div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Asset", "Type", "Environment", "Criticality", "Critical", "High", "Medium", "Risk Score", "SLA", "Owner", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => {
              const cc = CRIT_CFG[r.asset.criticality];
              return (
                <tr key={r.asset.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/assets/${r.asset.id}`)}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 28, height: 28, background: "#F1F5F9", color: "#64748B" }}>{TYPE_ICON[r.asset.type]}</div><span className="font-mono text-xs font-bold text-slate-900">{r.asset.name}</span></div></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{r.asset.type}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#FEF2F2", color: "#DC2626" }}>{r.asset.environment}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cc.text }} />{r.asset.criticality}</span></td>
                  <td className="px-4 py-3"><SevChip count={r.critical} color="#DC2626" bg="#FEF2F2" /></td>
                  <td className="px-4 py-3"><SevChip count={r.high} color="#EA580C" bg="#FFF7ED" /></td>
                  <td className="px-4 py-3"><SevChip count={r.medium} color="#D97706" bg="#FFFBEB" /></td>
                  <td className="px-4 py-3"><RiskScoreBar score={r.riskScore} /></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color: r.asset.slaStatus === "Breached" ? "#DC2626" : r.asset.slaStatus === "Due Soon" ? "#D97706" : "#16A34A" }}>{r.asset.slaStatus}</span></td>
                  <td className="px-4 py-3"><OwnerAvatar name={r.asset.owner} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Assets", val: assets.length, color: "#0F172A", bg: "#F8FAFC" },
          { label: "Critical Risk", val: assets.filter((a) => a.criticality === "Critical").length, color: "#DC2626", bg: "#FEF2F2" },
          { label: "SLA Breached", val: breachedCount, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Avg Risk Score", val: Math.round(rows.reduce((s, r) => s + r.riskScore, 0) / (rows.length || 1)), color: "#EA580C", bg: "#FFF7ED" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: s.bg, border: "1px solid #E2E8F0" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold font-heading" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}
