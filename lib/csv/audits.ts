import raw from "@/data/csv/audits.csv";
import { parseCsv, toNum, toOptional } from "./parse";
import type { Audit, AuditFrequency, AuditPriority, AuditScopeType, AuditStatus, AuditType } from "@/types/audit";
import type { BusinessCriticality } from "@/types/vulnerability";

export function getAudits(): Audit[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.auditId,
    name: r.auditName,
    auditType: r.auditType as AuditType,
    description: r.description,
    status: r.status as AuditStatus,
    priority: r.priority as AuditPriority,
    scopeType: r.scopeType as AuditScopeType,
    scopeId: r.scopeId,
    scopeName: r.scopeName,
    businessUnit: r.businessUnit,
    owner: r.owner,
    auditor: r.auditor,
    auditorEmail: r.auditorEmail,
    plannedStartDate: r.plannedStartDate,
    plannedEndDate: r.plannedEndDate,
    actualStartDate: toOptional(r.actualStartDate),
    actualEndDate: toOptional(r.actualEndDate),
    frequency: r.frequency as AuditFrequency,
    lastAuditDate: toOptional(r.lastAuditDate),
    nextAuditDate: toOptional(r.nextAuditDate),
    riskLevel: r.riskLevel as BusinessCriticality,
    findingCount: toNum(r.findingCount),
    criticalFindings: toNum(r.criticalFindings),
    highFindings: toNum(r.highFindings),
    mediumFindings: toNum(r.mediumFindings),
    lowFindings: toNum(r.lowFindings),
    createdDate: r.createdDate,
  }));
}
