"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Server, AppWindow, Globe, Database, Shield, Radio, Box, Cloud, ChevronDown, X } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { Asset, AssetType } from "@/types/asset";
import { OwnerAvatar, RiskScoreBar } from "@/components/common/badges";
import { isOpen } from "@/lib/business/metrics";
import { getAssetFindings, getAssetRiskScore } from "@/lib/business/asset-posture";
import { formatDate } from "@/lib/business/format";

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  Server: <Server size={13} />, Application: <AppWindow size={13} />, "Web Server": <Globe size={13} />,
  Database: <Database size={13} />, "API Gateway": <Shield size={13} />, "Auth Service": <Shield size={13} />,
  Endpoint: <Radio size={13} />, "Network Device": <Radio size={13} />, Container: <Box size={13} />, "Cloud Asset": <Cloud size={13} />,
};

const CRIT_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  High: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};

const STATUS_CFG: Record<string, { bg: string; text: string }> = {
  Active: { bg: "#F0FDF4", text: "#16A34A" },
  Inactive: { bg: "#F8FAFC", text: "#64748B" },
  Decommissioned: { bg: "#F8FAFC", text: "#94A3B8" },
  Unmanaged: { bg: "#FFFBEB", text: "#D97706" },
};

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

function isRecentlyDiscovered(asset: Asset, now: Date): boolean {
  if (!asset.firstSeen) return false;
  const days = Math.floor((now.getTime() - new Date(asset.firstSeen).getTime()) / 86400000);
  return days >= 0 && days <= 14;
}

interface AssetTableProps {
  initialCriticality?: string;
  initialStatus?: string;
  initialApplicationId?: string;
}

export default function AssetTable({ initialCriticality, initialStatus, initialApplicationId }: AssetTableProps) {
  const router = useRouter();
  const { assets, applications, vulnerabilities } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [buFilter, setBuFilter] = useState("");
  const [critFilter, setCritFilter] = useState(() => initialCriticality ?? "");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => initialStatus ?? "");
  const [internetFilter, setInternetFilter] = useState("");
  const [discoveryFilter, setDiscoveryFilter] = useState("");
  const [appFilter] = useState(() => initialApplicationId ?? "");

  const appById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);
  const now = new Date("2026-09-13");

  const rows = useMemo(
    () =>
      assets.map((a) => {
        const findings = getAssetFindings(a.id, vulnerabilities);
        const openFindings = findings.filter(isOpen);
        return {
          asset: a,
          appName: appById.get(a.applicationId)?.name ?? "—",
          findingsCount: findings.length,
          openCount: openFindings.length,
          riskScore: getAssetRiskScore(findings),
        };
      }),
    [assets, vulnerabilities, appById]
  );

  const types = useMemo(() => Array.from(new Set(assets.map((a) => a.type))).sort(), [assets]);
  const envs = useMemo(() => Array.from(new Set(assets.map((a) => a.environment))).sort(), [assets]);
  const bus = useMemo(() => Array.from(new Set(assets.map((a) => a.businessUnit))).sort(), [assets]);
  const owners = useMemo(() => Array.from(new Set(assets.map((a) => a.owner).filter(Boolean))).sort(), [assets]);
  const statuses = useMemo(() => Array.from(new Set(assets.map((a) => a.status).filter(Boolean))).sort() as string[], [assets]);
  const discoverySources = useMemo(() => Array.from(new Set(assets.map((a) => a.discoverySource).filter(Boolean))).sort() as string[], [assets]);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.asset.name.toLowerCase().includes(q) ||
      (r.asset.hostname ?? "").toLowerCase().includes(q) ||
      r.asset.ip.toLowerCase().includes(q) ||
      (r.asset.fqdn ?? "").toLowerCase().includes(q) ||
      r.appName.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (typeFilter && r.asset.type !== typeFilter) return false;
    if (envFilter && r.asset.environment !== envFilter) return false;
    if (buFilter && r.asset.businessUnit !== buFilter) return false;
    if (critFilter && r.asset.criticality !== critFilter) return false;
    if (ownerFilter && r.asset.owner !== ownerFilter) return false;
    if (statusFilter && r.asset.status !== statusFilter) return false;
    if (internetFilter && String(!!r.asset.internetFacing) !== internetFilter) return false;
    if (discoveryFilter && r.asset.discoverySource !== discoveryFilter) return false;
    if (appFilter && r.asset.applicationId !== appFilter) return false;
    return true;
  });

  const totalAssets = assets.length;
  const criticalAssets = assets.filter((a) => a.criticality === "Critical").length;
  const internetFacing = assets.filter((a) => a.internetFacing).length;
  const unmanaged = assets.filter((a) => a.status === "Unmanaged").length;
  const recentlyDiscovered = assets.filter((a) => isRecentlyDiscovered(a, now)).length;
  const withoutOwner = assets.filter((a) => !a.owner).length;

  const activeFilterCount = [typeFilter, envFilter, buFilter, critFilter, ownerFilter, statusFilter, internetFilter, discoveryFilter].filter(Boolean).length;
  const clearAll = () => {
    setTypeFilter(""); setEnvFilter(""); setBuFilter(""); setCritFilter(""); setOwnerFilter(""); setStatusFilter(""); setInternetFilter(""); setDiscoveryFilter("");
  };

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Asset Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">Discover, understand and manage the technology assets supporting your business.</p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {[
          { label: "Total Assets", val: totalAssets, color: "#0F172A", bg: "#F8FAFC" },
          { label: "Critical Assets", val: criticalAssets, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Internet-Facing", val: internetFacing, color: "#EA580C", bg: "#FFF7ED" },
          { label: "Unmanaged Assets", val: unmanaged, color: "#D97706", bg: "#FFFBEB" },
          { label: "Recently Discovered", val: recentlyDiscovered, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Without Owner", val: withoutOwner, color: "#7C3AED", bg: "#F5F3FF" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: s.bg, border: "1px solid #E2E8F0" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold font-heading" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1"
              placeholder="Search asset name, hostname, IP, FQDN, application..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={13} /></button>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0"><span className="font-semibold text-slate-900">{filtered.length.toLocaleString()}</span><span>assets</span></div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Filter by</span>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={types} />
          <FilterSelect label="Environment" value={envFilter} onChange={setEnvFilter} options={envs} />
          <FilterSelect label="Business Unit" value={buFilter} onChange={setBuFilter} options={bus} />
          <FilterSelect label="Criticality" value={critFilter} onChange={setCritFilter} options={["Critical", "High", "Medium", "Low"]} />
          <FilterSelect label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={owners} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statuses} />
          <FilterSelect label="Internet Facing" value={internetFilter} onChange={setInternetFilter} options={["true", "false"]} />
          <FilterSelect label="Discovery Source" value={discoveryFilter} onChange={setDiscoveryFilter} options={discoverySources} />
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"><X size={12} /> Clear all</button>
          )}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "2px solid #F1F5F9", background: "#FAFBFC" }}>
              {["Asset", "Type", "Environment", "Business Unit", "Owner", "Criticality", "Exposure", "Security Risk", "Findings", "Last Seen", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((r, i) => {
                const cc = CRIT_CFG[r.asset.criticality];
                const sc = STATUS_CFG[r.asset.status ?? "Active"] ?? STATUS_CFG.Active;
                return (
                  <tr key={r.asset.id} className="cursor-pointer transition-colors hover:bg-slate-50" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }} onClick={() => router.push(`/assets/${r.asset.id}`)}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 28, height: 28, background: "#F1F5F9", color: "#64748B" }}>{TYPE_ICON[r.asset.type]}</div><div><div className="font-mono text-xs font-bold text-slate-900">{r.asset.name}</div><div className="text-[10px] text-slate-400 mt-0.5">{r.asset.ip}</div></div></div></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-500">{r.asset.type}</span></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#FEF2F2", color: "#DC2626" }}>{r.asset.environment}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-600">{r.asset.businessUnit}</span></td>
                    <td className="px-4 py-3"><OwnerAvatar name={r.asset.owner} /></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cc.text }} />{r.asset.criticality}</span></td>
                    <td className="px-4 py-3">{r.asset.internetFacing ? <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#FFF7ED", color: "#EA580C" }}><Globe size={11} /> Internet</span> : <span className="text-xs text-slate-400">Internal</span>}</td>
                    <td className="px-4 py-3"><RiskScoreBar score={r.riskScore} /></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold text-slate-700">{r.findingsCount}</span>{r.openCount > 0 && <span className="text-[10px] text-slate-400 ml-1">({r.openCount} open)</span>}</td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(r.asset.lastSeen ?? r.asset.lastScan)}</span></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: sc.bg, color: sc.text }}>{r.asset.status ?? "Active"}</span></td>
                    <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-300" /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No assets match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
