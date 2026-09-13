import type { AuditScopeType } from "./audit";

export interface AuditScope {
  auditId: string;
  scopeType: AuditScopeType;
  scopeId: string;
  scopeName: string;
}
