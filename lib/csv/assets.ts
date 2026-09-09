import { readCsv } from "./parse";
import type { Asset, AssetType, SlaStatus } from "@/types/asset";
import type { BusinessCriticality, Environment } from "@/types/vulnerability";

export function getAssets(): Asset[] {
  const rows = readCsv<Record<string, string>>("assets.csv");
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
