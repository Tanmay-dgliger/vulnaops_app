"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ArrowDown, Share2 } from "lucide-react";
import { useData } from "@/lib/state/DataContext";

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-xs font-medium outline-none cursor-pointer"
        style={{ background: value ? "#EFF6FF" : "#F8FAFC", color: value ? "#2563EB" : "#64748B", border: `1px solid ${value ? "#BFDBFE" : "#E2E8F0"}` }}
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: value ? "#2563EB" : "#64748B" }} />
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  APPLICATION: "Application", ASSET: "Asset", API: "API", CLOUD_ASSET: "Cloud Asset", REPOSITORY: "Repository", DEPENDENCY: "Dependency", DATABASE: "Database",
};

export default function RelationshipExplorer() {
  const { assetRelationships, applications } = useData();
  const [relTypeFilter, setRelTypeFilter] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [appFilter, setAppFilter] = useState("");

  const relTypes = useMemo(() => Array.from(new Set(assetRelationships.map((r) => r.relationshipType))).sort(), [assetRelationships]);
  const sourceTypes = useMemo(() => Array.from(new Set(assetRelationships.map((r) => r.sourceType))).sort(), [assetRelationships]);
  const targetTypes = useMemo(() => Array.from(new Set(assetRelationships.map((r) => r.targetType))).sort(), [assetRelationships]);

  const filtered = assetRelationships.filter((r) => {
    if (relTypeFilter && r.relationshipType !== relTypeFilter) return false;
    if (sourceTypeFilter && r.sourceType !== sourceTypeFilter) return false;
    if (targetTypeFilter && r.targetType !== targetTypeFilter) return false;
    if (appFilter && !(r.sourceId === appFilter || r.targetId === appFilter)) return false;
    return true;
  });

  const chain = useMemo(() => {
    if (!appFilter) return null;
    const app = applications.find((a) => a.id === appFilter);
    if (!app) return null;
    const rels = assetRelationships.filter((r) => r.sourceId === appFilter || r.targetId === appFilter);
    const apis = rels.filter((r) => r.relationshipType === "EXPOSES").map((r) => r.targetName);
    const servers = rels.filter((r) => r.relationshipType === "RUNS_ON").map((r) => r.targetName);
    const databases = rels.filter((r) => r.relationshipType === "CONNECTS_TO").map((r) => r.targetName);
    const deps = rels.filter((r) => r.relationshipType === "DEPENDS_ON").map((r) => r.targetName);
    const serverIds = rels.filter((r) => r.relationshipType === "RUNS_ON").map((r) => r.targetId);
    const cloud = assetRelationships.filter((r) => r.sourceType === "ASSET" && serverIds.includes(r.sourceId) && r.relationshipType === "DEPLOYED_ON").map((r) => r.targetName);
    return { app, apis, servers, databases, deps, cloud };
  }, [appFilter, applications, assetRelationships]);

  const clearAll = () => { setRelTypeFilter(""); setSourceTypeFilter(""); setTargetTypeFilter(""); setAppFilter(""); };
  const activeCount = [relTypeFilter, sourceTypeFilter, targetTypeFilter, appFilter].filter(Boolean).length;

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Asset Relationships</h1>
        <p className="text-sm text-slate-500 mt-0.5">Explore how applications, APIs, servers, cloud assets and dependencies connect</p>
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Filter by</span>
          <FilterSelect label="Application" value={appFilter} onChange={setAppFilter} options={applications.map((a) => a.id)} />
          <FilterSelect label="Relationship Type" value={relTypeFilter} onChange={setRelTypeFilter} options={relTypes} />
          <FilterSelect label="Source Type" value={sourceTypeFilter} onChange={setSourceTypeFilter} options={sourceTypes} />
          <FilterSelect label="Target Type" value={targetTypeFilter} onChange={setTargetTypeFilter} options={targetTypes} />
          {activeCount > 0 && <button onClick={clearAll} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Clear all</button>}
        </div>
      </div>

      {chain && (
        <div className="rounded-xl border p-5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-2 mb-4">
            <Share2 size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">{chain.app.name} — relationship chain</h3>
          </div>
          <div className="flex flex-col items-center gap-1">
            {[
              { label: chain.app.name, sub: "Application", color: "#2563EB", bg: "#EFF6FF" },
              ...chain.apis.map((n) => ({ label: n, sub: "API", color: "#7C3AED", bg: "#F5F3FF" })),
              ...chain.servers.map((n) => ({ label: n, sub: "Server", color: "#0F766E", bg: "#F0FDFA" })),
              ...chain.cloud.map((n) => ({ label: n, sub: "Cloud Asset", color: "#C2410C", bg: "#FFF7ED" })),
              ...chain.databases.map((n) => ({ label: n, sub: "Database", color: "#B45309", bg: "#FFFBEB" })),
              ...chain.deps.slice(0, 3).map((n) => ({ label: n, sub: "Dependency", color: "#15803D", bg: "#F0FDF4" })),
            ].map((node, i, arr) => (
              <div key={`${node.sub}-${node.label}-${i}`} className="flex flex-col items-center">
                <div className="rounded-lg px-4 py-2 text-center min-w-[220px]" style={{ background: node.bg, border: `1px solid ${node.color}33` }}>
                  <div className="text-xs font-semibold" style={{ color: node.color }}>{node.label}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">{node.sub}</div>
                </div>
                {i < arr.length - 1 && <ArrowDown size={14} className="text-slate-300 my-1" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
          <h3 className="text-sm font-semibold text-slate-900">Relationships</h3>
          <span className="text-xs text-slate-400">{filtered.length.toLocaleString()} of {assetRelationships.length.toLocaleString()}</span>
        </div>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["Source", "Source Type", "Relationship", "Target", "Target Type", "Status"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.slice(0, 200).map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{r.sourceName}</td>
                <td className="px-4 py-2.5 text-[11px] text-slate-400 uppercase tracking-wide">{TYPE_LABEL[r.sourceType] ?? r.sourceType}</td>
                <td className="px-4 py-2.5"><span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: "#EFF6FF", color: "#2563EB" }}>{r.relationshipType}</span></td>
                <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{r.targetName}</td>
                <td className="px-4 py-2.5 text-[11px] text-slate-400 uppercase tracking-wide">{TYPE_LABEL[r.targetType] ?? r.targetType}</td>
                <td className="px-4 py-2.5"><span className="text-xs text-slate-500">{r.status}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">No relationships match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="h-4" />
    </div>
  );
}
