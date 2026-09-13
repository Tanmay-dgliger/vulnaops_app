import raw from "@/data/csv/cloud-assets.csv";
import { parseCsv, toBool } from "./parse";
import type { CloudAsset } from "@/types/cloud-asset";
import type { BusinessCriticality, Environment } from "@/types/vulnerability";

export function getCloudAssets(): CloudAsset[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.cloudAssetId,
    name: r.assetName,
    cloudProvider: r.cloudProvider,
    accountId: r.accountId,
    region: r.region,
    resourceType: r.resourceType,
    environment: r.environment as Environment,
    businessUnit: r.businessUnit,
    owner: r.owner,
    criticality: r.criticality as BusinessCriticality,
    internetFacing: toBool(r.internetFacing),
    status: r.status,
    discoverySource: r.discoverySource,
    lastSeen: r.lastSeen,
  }));
}
