"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, CheckCircle2, GitMerge, Ban, Plus } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import type { AssetDiscoveryRecord, MatchStatus } from "@/types/asset-discovery";
import type { Asset, AssetType } from "@/types/asset";
import type { BusinessCriticality, Environment } from "@/types/vulnerability";
import { formatDate } from "@/lib/business/format";
import { getDiscoveryMatches } from "@/lib/business/asset-posture";

const STATUS_CFG: Record<MatchStatus, { bg: string; text: string }> = {
  Matched: { bg: "#F0FDF4", text: "#16A34A" },
  New: { bg: "#EFF6FF", text: "#2563EB" },
  "Possible Duplicate": { bg: "#FFFBEB", text: "#D97706" },
  Unmanaged: { bg: "#FFF7ED", text: "#EA580C" },
  Ignored: { bg: "#F8FAFC", text: "#94A3B8" },
};

const ASSET_TYPES: AssetType[] = ["Server", "Application", "Web Server", "Database", "API Gateway", "Auth Service", "Endpoint", "Network Device", "Container", "Cloud Asset"];

function guessType(raw: string): AssetType {
  const match = ASSET_TYPES.find((t) => t.toLowerCase() === raw.toLowerCase());
  return match ?? "Server";
}

function AddToInventoryModal({
  record,
  onClose,
  onSubmit,
}: {
  record: AssetDiscoveryRecord;
  onClose: () => void;
  onSubmit: (input: { name: string; type: AssetType; environment: Environment; owner: string; criticality: BusinessCriticality }) => void;
}) {
  const [name, setName] = useState(record.assetName);
  const [type, setType] = useState<AssetType>(guessType(record.assetType));
  const [environment, setEnvironment] = useState<Environment>((record.environment as Environment) || "Production");
  const [owner, setOwner] = useState("");
  const [criticality, setCriticality] = useState<BusinessCriticality>("Medium");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="rounded-xl w-full max-w-md" style={{ background: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold text-slate-900">Add to Inventory</h3>
          <p className="text-xs text-slate-500 mt-0.5">Reconcile discovery record {record.id} into the Asset Inventory</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Asset Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Asset Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Environment</label>
              <select value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                {(["Production", "Staging", "Development", "DR"] as Environment[]).map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Owner</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Unassigned" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Criticality</label>
              <select value={criticality} onChange={(e) => setCriticality(e.target.value as BusinessCriticality)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                {(["Critical", "High", "Medium", "Low"] as BusinessCriticality[]).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "#F1F5F9" }}>
          <button onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }}>Cancel</button>
          <button
            onClick={() => onSubmit({ name, type, environment, owner: owner || "Unassigned", criticality })}
            className="rounded-md px-3 py-2 text-sm font-semibold text-white"
            style={{ background: "#2563EB" }}
          >
            Add Asset
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetDiscovery() {
  const router = useRouter();
  const { assetDiscovery, assets, matchDiscovery, createAssetFromDiscovery, ignoreDiscovery } = useData();
  const [modalRecord, setModalRecord] = useState<AssetDiscoveryRecord | null>(null);
  const now = new Date("2026-09-13");

  const enriched = useMemo(() => assetDiscovery.map((d) => ({ record: d, match: getDiscoveryMatches(d, assets) })), [assetDiscovery, assets]);

  const discoveredToday = assetDiscovery.filter((d) => d.discoveredAt === "2026-09-13").length;
  const newAssets = assetDiscovery.filter((d) => d.status === "New").length;
  const updatedAssets = assetDiscovery.filter((d) => d.status === "Matched").length;
  const unmanagedAssets = assetDiscovery.filter((d) => d.status === "Unmanaged").length;
  const unknownAssets = assetDiscovery.filter((d) => d.status === "Possible Duplicate").length;
  const discoverySources = new Set(assetDiscovery.map((d) => d.discoverySource)).size;

  const handleCreate = (input: { name: string; type: AssetType; environment: Environment; owner: string; criticality: BusinessCriticality }) => {
    if (!modalRecord) return;
    const asset: Asset = createAssetFromDiscovery(modalRecord.id, input);
    setModalRecord(null);
    router.push(`/assets/${asset.id}`);
  };

  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Asset Discovery</h1>
        <p className="text-sm text-slate-500 mt-0.5">Identify new, changed and unmanaged technology assets across the enterprise.</p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {[
          { label: "Discovered Today", val: discoveredToday, color: "#2563EB", bg: "#EFF6FF" },
          { label: "New Assets", val: newAssets, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Updated Assets", val: updatedAssets, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Unmanaged Assets", val: unmanagedAssets, color: "#EA580C", bg: "#FFF7ED" },
          { label: "Unknown Assets", val: unknownAssets, color: "#D97706", bg: "#FFFBEB" },
          { label: "Discovery Sources", val: discoverySources, color: "#7C3AED", bg: "#F5F3FF" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: s.bg, border: "1px solid #E2E8F0" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold font-heading" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9", background: "#FAFBFC" }}>
          <Radar size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Discovery Queue</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>
            {["Discovery ID", "Asset", "Type", "Source", "Environment", "Discovered", "Last Seen", "Match Status", "Confidence", "Action"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {enriched.map(({ record, match }, i) => {
              const sc = STATUS_CFG[record.status];
              return (
                <tr key={record.id} style={{ borderBottom: i < enriched.length - 1 ? "1px solid #F8FAFC" : "none" }} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{record.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-slate-900">{record.assetName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{record.hostname || record.ipAddress || record.cloudProvider || "—"}</div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{record.assetType}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600">{record.discoverySource}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "#FEF2F2", color: "#DC2626" }}>{record.environment}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(record.discoveredAt)}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{formatDate(record.lastSeen)}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: sc.bg, color: sc.text }}>{record.status}</span></td>
                  <td className="px-4 py-3">{match.candidate ? <span className="text-xs font-bold text-slate-700">{match.confidence}%</span> : <span className="text-xs text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(record.status === "Possible Duplicate" || record.status === "Unmanaged") && match.candidate && (
                        <button onClick={() => matchDiscovery(record.id, match.candidate!.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}><GitMerge size={11} /> Match</button>
                      )}
                      {(record.status === "New" || record.status === "Possible Duplicate" || record.status === "Unmanaged") && (
                        <button onClick={() => setModalRecord(record)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}><Plus size={11} /> {record.status === "New" ? "Add to Inventory" : "Create New"}</button>
                      )}
                      {record.status !== "Ignored" && record.status !== "Matched" && (
                        <button onClick={() => ignoreDiscovery(record.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}><Ban size={11} /> Ignore</button>
                      )}
                      {record.status === "Matched" && record.matchedAssetId && (
                        <button onClick={() => router.push(`/assets/${record.matchedAssetId}`)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}><CheckCircle2 size={11} /> View Asset</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400">Demo workflow — reconciliation actions update local session state only, no live network scanning is performed.</p>
      <div className="h-4" />

      {modalRecord && <AddToInventoryModal record={modalRecord} onClose={() => setModalRecord(null)} onSubmit={handleCreate} />}
    </div>
  );
}
