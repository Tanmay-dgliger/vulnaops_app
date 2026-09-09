import type { Asset } from "@/types/asset";
import type { Application } from "@/types/application";
import type { Vulnerability, VulnerabilitySeverity } from "@/types/vulnerability";
import { calculateSlaStatus } from "./sla";

const OPEN_STATUSES = new Set(["New", "Triaged", "Assigned", "Remediating", "Validation", "Potential False Positive"]);

export function isOpen(v: Vulnerability): boolean {
  return OPEN_STATUSES.has(v.status);
}

export interface DashboardMetrics {
  totalFindings: number;
  criticalAndHigh: number;
  openVulnerabilities: number;
  slaBreaches: number;
  remediated: number;
  falsePositives: number;
}

export function getDashboardMetrics(vulns: Vulnerability[]): DashboardMetrics {
  const totalFindings = vulns.length;
  const criticalAndHigh = vulns.filter((v) => (v.severity === "Critical" || v.severity === "High") && isOpen(v)).length;
  const openVulnerabilities = vulns.filter(isOpen).length;
  const slaBreaches = vulns.filter((v) => isOpen(v) && calculateSlaStatus(v.severity, v.firstSeen, v.status).state === "Breached").length;
  const remediated = vulns.filter((v) => v.status === "Closed").length;
  const falsePositives = vulns.filter((v) => v.status === "False Positive" || v.status === "Potential False Positive").length;

  return { totalFindings, criticalAndHigh, openVulnerabilities, slaBreaches, remediated, falsePositives };
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface TrendPoint {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

/** Cumulative open findings by the month they were first seen, real CSV aggregation. */
export function getVulnerabilityTrend(vulns: Vulnerability[], monthsBack = 6): TrendPoint[] {
  const now = new Date("2026-09-09");
  const buckets: TrendPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: MONTH_LABELS[d.getMonth()], critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  }

  for (const v of vulns) {
    const seen = new Date(v.firstSeen);
    const monthDiff = (now.getFullYear() - seen.getFullYear()) * 12 + (now.getMonth() - seen.getMonth());
    if (monthDiff < 0 || monthDiff >= monthsBack) continue;
    const bucketIndex = monthsBack - 1 - monthDiff;
    const bucket = buckets[bucketIndex];
    bucket.total += 1;
    if (v.severity === "Critical") bucket.critical += 1;
    else if (v.severity === "High") bucket.high += 1;
    else if (v.severity === "Medium") bucket.medium += 1;
    else bucket.low += 1;
  }

  // Make it cumulative so the chart reads as "findings open by month" rather than "new that month"
  for (let i = 1; i < buckets.length; i++) {
    buckets[i].critical += buckets[i - 1].critical;
    buckets[i].high += buckets[i - 1].high;
    buckets[i].medium += buckets[i - 1].medium;
    buckets[i].low += buckets[i - 1].low;
    buckets[i].total += buckets[i - 1].total;
  }

  return buckets;
}

export interface SeveritySlice {
  name: VulnerabilitySeverity;
  value: number;
  color: string;
}

const SEVERITY_COLOR: Record<VulnerabilitySeverity, string> = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#16A34A",
};

export function getSeverityDistribution(vulns: Vulnerability[]): SeveritySlice[] {
  const open = vulns.filter(isOpen);
  const order: VulnerabilitySeverity[] = ["Critical", "High", "Medium", "Low"];
  return order.map((sev) => ({
    name: sev,
    value: open.filter((v) => v.severity === sev).length,
    color: SEVERITY_COLOR[sev],
  }));
}

export interface BusinessUnitRisk {
  name: string;
  score: number;
  critical: number;
  high: number;
}

export function getBusinessUnitRisk(vulns: Vulnerability[], assets: Asset[]): BusinessUnitRisk[] {
  const byBu = new Map<string, { scores: number[]; critical: number; high: number }>();
  const assetById = new Map(assets.map((a) => [a.id, a]));

  for (const v of vulns) {
    if (!isOpen(v)) continue;
    const asset = assetById.get(v.assetId);
    const bu = asset?.businessUnit ?? "Unknown";
    if (!byBu.has(bu)) byBu.set(bu, { scores: [], critical: 0, high: 0 });
    const entry = byBu.get(bu)!;
    entry.scores.push(v.riskScore);
    if (v.severity === "Critical") entry.critical += 1;
    if (v.severity === "High") entry.high += 1;
  }

  return Array.from(byBu.entries())
    .map(([name, { scores, critical, high }]) => ({
      name,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      critical,
      high,
    }))
    .sort((a, b) => b.score - a.score);
}

export interface TopAssetRow {
  asset: Asset;
  critical: number;
  high: number;
  riskScore: number;
  slaStatus: string;
}

export function getTopAssets(vulns: Vulnerability[], assets: Asset[], limit = 10): TopAssetRow[] {
  return assets
    .map((asset) => {
      const assetVulns = vulns.filter((v) => v.assetId === asset.id && isOpen(v));
      const critical = assetVulns.filter((v) => v.severity === "Critical").length;
      const high = assetVulns.filter((v) => v.severity === "High").length;
      const riskScore = assetVulns.length ? Math.max(...assetVulns.map((v) => v.riskScore)) : 0;
      return { asset, critical, high, riskScore, slaStatus: asset.slaStatus };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

export interface TopCveRow {
  cve: string;
  title: string;
  severity: VulnerabilitySeverity;
  assetCount: number;
  maxAge: number;
  status: string;
}

export function getTopCVEs(vulns: Vulnerability[], limit = 10): TopCveRow[] {
  const byCve = new Map<string, Vulnerability[]>();
  for (const v of vulns) {
    if (!byCve.has(v.cve)) byCve.set(v.cve, []);
    byCve.get(v.cve)!.push(v);
  }
  const now = new Date("2026-09-09").getTime();
  const rows: TopCveRow[] = Array.from(byCve.entries()).map(([cve, list]) => {
    const first = list[0];
    const assetCount = new Set(list.map((v) => v.assetId)).size;
    const maxAge = Math.max(...list.map((v) => Math.floor((now - new Date(v.firstSeen).getTime()) / 86400000)));
    return { cve, title: first.title, severity: first.severity, assetCount, maxAge, status: first.status };
  });
  return rows.sort((a, b) => b.assetCount - a.assetCount).slice(0, limit);
}

export interface TopApplicationRow {
  application: Application;
  critical: number;
  high: number;
  total: number;
  riskScore: number;
}

export function getTopApplications(vulns: Vulnerability[], applications: Application[], limit = 10): TopApplicationRow[] {
  return applications
    .map((app) => {
      const appVulns = vulns.filter((v) => v.applicationId === app.id && isOpen(v));
      const critical = appVulns.filter((v) => v.severity === "Critical").length;
      const high = appVulns.filter((v) => v.severity === "High").length;
      const riskScore = appVulns.length ? Math.max(...appVulns.map((v) => v.riskScore)) : 0;
      return { application: app, critical, high, total: appVulns.length, riskScore };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

export interface SlaComplianceSummary {
  withinSla: number;
  dueSoon: number;
  breached: number;
  compliancePct: number;
}

export function getSlaCompliance(vulns: Vulnerability[]): SlaComplianceSummary {
  const open = vulns.filter(isOpen);
  let withinSla = 0;
  let dueSoon = 0;
  let breached = 0;
  for (const v of open) {
    const status = calculateSlaStatus(v.severity, v.firstSeen, v.status).state;
    if (status === "Breached") breached += 1;
    else if (status === "Due Soon") dueSoon += 1;
    else withinSla += 1;
  }
  const total = open.length || 1;
  return { withinSla, dueSoon, breached, compliancePct: Math.round(((withinSla + dueSoon) / total) * 100) };
}
