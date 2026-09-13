import raw from "@/data/csv/asset-discovery.csv";
import { parseCsv, toNum, toOptional } from "./parse";
import type { AssetDiscoveryRecord, MatchStatus } from "@/types/asset-discovery";

export function getAssetDiscoveryRecords(): AssetDiscoveryRecord[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.discoveryId,
    discoverySource: r.discoverySource,
    assetType: r.assetType,
    assetName: r.assetName,
    ipAddress: toOptional(r.ipAddress),
    hostname: toOptional(r.hostname),
    cloudProvider: toOptional(r.cloudProvider),
    environment: r.environment,
    discoveredAt: r.discoveredAt,
    lastSeen: r.lastSeen,
    status: r.status as MatchStatus,
    matchedAssetId: toOptional(r.matchedAssetId),
    confidence: r.confidence ? toNum(r.confidence) : undefined,
  }));
}
