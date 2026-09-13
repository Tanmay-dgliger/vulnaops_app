"use client";

import { useState } from "react";
import { Search, Globe, Cloud } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { OwnerAvatar } from "@/components/common/badges";

const CRIT_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  High: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};
const PROVIDER_CFG: Record<string, { bg: string; text: string }> = {
  AWS: { bg: "#FFF7ED", text: "#C2410C" },
  Azure: { bg: "#EFF6FF", text: "#1D4ED8" },
  GCP: { bg: "#F0FDF4", text: "#15803D" },
};

export default function CloudAssetTable() {
  const { cloudAssets } = useData();
  const [search, setSearch] = useState("");

  const filtered = cloudAssets.filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.resourceType.toLowerCase().includes(q) || c.accountId.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Cloud Assets</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cloud-hosted resources discovered across AWS, Azure and GCP accounts</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search cloud assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} cloud assets</div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Asset", "Provider", "Account", "Region", "Resource Type", "Environment", "Business Unit", "Owner", "Criticality", "Exposure", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((c, i) => {
              const cc = CRIT_CFG[c.criticality];
              const pc = PROVIDER_CFG[c.cloudProvider] ?? { bg: "#F8FAFC", text: "#64748B" };
              return (
                <tr key={c.id} className="transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 28, height: 28, background: "#F1F5F9", color: "#64748B" }}><Cloud size={13} /></div><span className="text-xs font-bold text-slate-900">{c.name}</span></div></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold" style={{ background: pc.bg, color: pc.text }}>{c.cloudProvider}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-slate-600">{c.accountId}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{c.region}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-700">{c.resourceType}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#FEF2F2", color: "#DC2626" }}>{c.environment}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600">{c.businessUnit}</span></td>
                  <td className="px-4 py-3"><OwnerAvatar name={c.owner} /></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}>{c.criticality}</span></td>
                  <td className="px-4 py-3">{c.internetFacing ? <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#FFF7ED", color: "#EA580C" }}><Globe size={11} /> Internet</span> : <span className="text-xs text-slate-400">Internal</span>}</td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{c.status}</span></td>
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
