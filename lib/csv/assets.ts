import raw from "@/data/csv/assets.csv";
import { parseCsv } from "./parse";
import type { Asset, AssetType, SlaStatus } from "@/types/asset";
import type { BusinessCriticality, Environment } from "@/types/vulnerability";

export function getAssets(): Asset[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as AssetType,
    environment: r.environment as Environment,
    applicationId: r.applicationId,
    businessUnit: r.businessUnit,
    criticality: r.criticality as BusinessCriticality,
    ip: r.ip,
    os: r.os,
    owner: r.owner,
    lastScan: r.lastScan,
    slaStatus: r.slaStatus as SlaStatus,
  }));
}
