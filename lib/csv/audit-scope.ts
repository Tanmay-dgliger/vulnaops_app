import raw from "@/data/csv/audit-scope.csv";
import { parseCsv } from "./parse";
import type { AuditScope } from "@/types/audit-scope";
import type { AuditScopeType } from "@/types/audit";

export function getAuditScopes(): AuditScope[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    auditId: r.auditId,
    scopeType: r.scopeType as AuditScopeType,
    scopeId: r.scopeId,
    scopeName: r.scopeName,
  }));
}
