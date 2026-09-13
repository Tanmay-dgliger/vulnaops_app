export type MatchStatus = "Matched" | "New" | "Possible Duplicate" | "Unmanaged" | "Ignored";

export interface AssetDiscoveryRecord {
  id: string;
  discoverySource: string;
  assetType: string;
  assetName: string;
  ipAddress?: string;
  hostname?: string;
  cloudProvider?: string;
  environment: string;
  discoveredAt: string;
  lastSeen: string;
  status: MatchStatus;
  matchedAssetId?: string;
  confidence?: number;
}
