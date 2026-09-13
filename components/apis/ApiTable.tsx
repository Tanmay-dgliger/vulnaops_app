"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Globe } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { OwnerAvatar } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";
import { formatDate } from "@/lib/business/format";

const CRIT_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  High: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};

export default function ApiTable() {
  const router = useRouter();
  const { apis, applications, vulnerabilities } = useData();
  const [search, setSearch] = useState("");
  const appById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);

  const rows = useMemo(
    () =>
      apis.map((api) => {
        const dastFindings = vulnerabilities.filter((v) => v.apiId === api.id && isOpen(v));
        return { api, appName: appById.get(api.applicationId)?.name ?? "—", dastCount: dastFindings.length };
      }),
    [apis, appById, vulnerabilities]
  );

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || r.api.name.toLowerCase().includes(q) || r.api.endpoint.toLowerCase().includes(q) || r.appName.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">APIs</h1>
        <p className="text-sm text-slate-500 mt-0.5">API inventory across all applications, with DAST exposure context</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1" placeholder="Search APIs, endpoints, applications..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} APIs</div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
            {["API", "Application", "Endpoint", "Method", "Environment", "Owner", "Criticality", "Exposure", "Auth", "DAST Findings", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => {
              const cc = CRIT_CFG[r.api.criticality];
              return (
                <tr key={r.api.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/applications/${r.api.applicationId}`)}>
                  <td className="px-4 py-3"><span className="text-xs font-bold text-slate-900">{r.api.name}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600">{r.appName}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-slate-700">{r.api.endpoint}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "#F1F5F9", color: "#334155" }}>{r.api.method}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#FEF2F2", color: "#DC2626" }}>{r.api.environment}</span></td>
                  <td className="px-4 py-3"><OwnerAvatar name={r.api.owner} /></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}>{r.api.criticality}</span></td>
                  <td className="px-4 py-3">{r.api.internetFacing ? <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#FFF7ED", color: "#EA580C" }}><Globe size={11} /> Internet</span> : <span className="text-xs text-slate-400">Internal</span>}</td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{r.api.authentication}</span></td>
                  <td className="px-4 py-3">{r.dastCount > 0 ? <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold" style={{ background: "#FEF2F2", color: "#DC2626" }}>{r.dastCount}</span> : <span className="text-xs text-slate-400">0</span>}</td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{r.api.status} · {formatDate(r.api.lastSeen)}</span></td>
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
