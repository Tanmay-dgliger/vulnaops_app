import raw from "@/data/csv/audit-findings.csv";
import { parseCsv, toNum, toOptional } from "./parse";
import type { AuditFinding, AuditFindingStatus } from "@/types/audit-finding";
import type { VulnerabilitySeverity } from "@/types/vulnerability";

export function getAuditFindings(): AuditFinding[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.auditFindingId,
    auditId: r.auditId,
    title: r.title,
    description: r.description,
    category: r.category,
    severity: r.severity as VulnerabilitySeverity,
    status: r.status as AuditFindingStatus,
    assetId: toOptional(r.assetId),
    applicationId: toOptional(r.applicationId),
    apiId: toOptional(r.apiId),
    owner: toOptional(r.owner),
    assignedTo: toOptional(r.assignedTo),
    dueDate: toOptional(r.dueDate),
    createdDate: r.createdDate,
    riskScore: toNum(r.riskScore),
    remediationId: toOptional(r.remediationId),
  }));
}
