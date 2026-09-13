import type { Asset } from "@/types/asset";
import type { Application } from "@/types/application";
import type { Api } from "@/types/api";
import type { CloudAsset } from "@/types/cloud-asset";
import type { AssetRelationship } from "@/types/asset-relationship";
import type { AssetDiscoveryRecord } from "@/types/asset-discovery";
import type { FindingType, Vulnerability } from "@/types/vulnerability";
import { isOpen } from "./metrics";
import { calculateSlaStatus } from "./sla";

/** All findings tied to an asset — directly (assetId) or, when an applicationId is supplied,
 *  transitively through the application it belongs to (covers SAST/SCA findings that live on
 *  an application/repository rather than a physical asset). */
export function getAssetFindings(assetId: string, vulns: Vulnerability[], applicationId?: string): Vulnerability[] {
  return vulns.filter((v) => v.assetId === assetId || (applicationId && v.applicationId === applicationId && v.assetId === assetId));
}

export function getAssetRiskScore(findings: Vulnerability[]): number {
  const open = findings.filter(isOpen);
  return open.length ? Math.max(...open.map((v) => v.riskScore)) : 0;
}

export interface AssetSecurityPosture {
  riskScore: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<FindingType, number>;
  open: number;
  overdue: number;
  exceptions: number;
}

/** Reuses the platform's existing isOpen/SLA logic — this is not a second risk model,
 *  just an asset-scoped rollup of the same finding-level numbers shown elsewhere. */
export function getAssetSecurityPosture(findings: Vulnerability[], exceptionCount = 0): AssetSecurityPosture {
  const open = findings.filter(isOpen);
  const overdue = open.filter((v) => calculateSlaStatus(v.severity, v.firstSeen, v.status).state === "Breached").length;
  const byType: Record<FindingType, number> = { VAPT: 0, SAST: 0, DAST: 0, SCA: 0 };
  for (const v of findings) byType[v.findingType] += 1;

  return {
    riskScore: getAssetRiskScore(findings),
    critical: open.filter((v) => v.severity === "Critical").length,
    high: open.filter((v) => v.severity === "High").length,
    medium: open.filter((v) => v.severity === "Medium").length,
    low: open.filter((v) => v.severity === "Low").length,
    byType,
    open: open.length,
    overdue,
    exceptions: exceptionCount,
  };
}

export interface ApplicationAssets {
  servers: Asset[];
  apis: Api[];
  databases: Asset[];
  cloudAssets: CloudAsset[];
  repository?: string;
}

export function getApplicationAssets(
  applicationId: string,
  data: { assets: Asset[]; apis: Api[]; cloudAssets: CloudAsset[]; relationships: AssetRelationship[]; applications: Application[] }
): ApplicationAssets {
  const appAssets = data.assets.filter((a) => a.applicationId === applicationId);
  const app = data.applications.find((a) => a.id === applicationId);
  const linkedAssetIds = new Set(
    data.relationships
      .filter((r) => r.sourceType === "APPLICATION" && r.sourceId === applicationId && (r.targetType === "ASSET" || r.targetType === "DATABASE"))
      .map((r) => r.targetId)
  );
  const linkedCloudIds = new Set(
    data.relationships
      .filter((r) => r.sourceType === "ASSET" && r.targetType === "CLOUD_ASSET" && (appAssets.some((a) => a.id === r.sourceId) || linkedAssetIds.has(r.sourceId)))
      .map((r) => r.targetId)
  );

  return {
    servers: appAssets.filter((a) => a.type !== "Database"),
    databases: appAssets.filter((a) => a.type === "Database"),
    apis: data.apis.filter((a) => a.applicationId === applicationId),
    cloudAssets: data.cloudAssets.filter((c) => linkedCloudIds.has(c.id)),
    repository: app?.repository,
  };
}

/** Direct relationships (both directions) for a given entity, used by the Relationship Explorer. */
export function getAssetRelationshipsFor(entityType: string, entityId: string, relationships: AssetRelationship[]): AssetRelationship[] {
  return relationships.filter(
    (r) => (r.sourceType === entityType && r.sourceId === entityId) || (r.targetType === entityType && r.targetId === entityId)
  );
}

export interface AssetCoverage {
  total: number;
  scanned: number;
  coveragePct: number;
}

/** "Scanned" = has at least one associated finding of any type — a simple, real proxy for
 *  coverage given this demo dataset has no separate scan-schedule record. */
export function getAssetCoverage(assets: Asset[], vulns: Vulnerability[]): AssetCoverage {
  const scannedIds = new Set(vulns.map((v) => v.assetId));
  const scanned = assets.filter((a) => scannedIds.has(a.id)).length;
  const total = assets.length;
  return { total, scanned, coveragePct: total ? Math.round((scanned / total) * 100) : 0 };
}

export interface DiscoveryMatch {
  record: AssetDiscoveryRecord;
  candidate?: Asset;
  confidence: number;
}

/** Deterministic match signals: hostname / IP / cloud resource name equality against the
 *  existing inventory. Used to suggest a match when reconciling a discovery record. */
export function getDiscoveryMatches(record: AssetDiscoveryRecord, assets: Asset[]): DiscoveryMatch {
  if (record.matchedAssetId) {
    const candidate = assets.find((a) => a.id === record.matchedAssetId);
    return { record, candidate, confidence: record.confidence ?? (candidate ? 90 : 0) };
  }
  const candidate = assets.find(
    (a) =>
      (record.hostname && a.hostname && a.hostname.toLowerCase() === record.hostname.toLowerCase()) ||
      (record.ipAddress && a.ip === record.ipAddress)
  );
  return { record, candidate, confidence: candidate ? 85 : 0 };
}
