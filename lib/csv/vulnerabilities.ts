import { readCsv, toBool, toNum, toOptional } from "./parse";
import type {
  BusinessCriticality,
  DataSensitivity,
  Environment,
  Vulnerability,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@/types/vulnerability";

export function getVulnerabilities(): Vulnerability[] {
  const rows = readCsv<Record<string, string>>("vulnerabilities.csv");
  return rows.map((r) => ({
    id: r.id,
    cve: r.cve,
    title: r.title,
    description: r.description,
    severity: r.severity as VulnerabilitySeverity,
    cvss: toNum(r.cvss),
    assetId: r.assetId,
    applicationId: r.applicationId,
    scanner: r.scanner,
    pluginId: r.pluginId,
    port: r.port ? toNum(r.port) : undefined,
    protocol: toOptional(r.protocol),
    firstSeen: r.firstSeen,
    lastSeen: r.lastSeen,
    status: r.status as VulnerabilityStatus,
    owner: toOptional(r.owner),
    dueDate: toOptional(r.dueDate),
    environment: r.environment as Environment,
    internetExposed: toBool(r.internetExposed),
    exploitAvailable: toBool(r.exploitAvailable),
    businessCriticality: r.businessCriticality as BusinessCriticality,
    dataSensitivity: r.dataSensitivity as DataSensitivity,
    riskScore: toNum(r.riskScore),
    epssScore: r.epssScore ? toNum(r.epssScore) : undefined,
    cwe: toOptional(r.cwe),
    isDuplicate: toBool(r.isDuplicate),
    parentFindingId: toOptional(r.parentFindingId),
    falsePositiveReason: toOptional(r.falsePositiveReason),
    affectedComponent: toOptional(r.affectedComponent),
  }));
}
