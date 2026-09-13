import raw from "@/data/csv/assets.csv";
import { parseCsv, toBool, toOptional } from "./parse";
import type { Asset, AssetStatus, AssetType, SlaStatus } from "@/types/asset";
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
    assetSubType: toOptional(r.assetSubType),
    hostname: toOptional(r.hostname),
    fqdn: toOptional(r.fqdn),
    ownerEmail: toOptional(r.ownerEmail),
    status: toOptional(r.status) as AssetStatus | undefined,
    internetFacing: r.internetFacing ? toBool(r.internetFacing) : undefined,
    discoverySource: toOptional(r.discoverySource),
    firstSeen: toOptional(r.firstSeen),
    lastSeen: toOptional(r.lastSeen),
    cloudProvider: toOptional(r.cloudProvider),
    cloudAccount: toOptional(r.cloudAccount),
    region: toOptional(r.region),
    location: toOptional(r.location),
    businessService: toOptional(r.businessService),
    description: toOptional(r.description),
  }));
}
