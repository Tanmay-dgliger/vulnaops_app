import type { BusinessCriticality } from "./vulnerability";

export type AuditType =
  | "Security Audit"
  | "Infrastructure Audit"
  | "Application Audit"
  | "API Security Audit"
  | "Cloud Security Audit"
  | "Internal Audit"
  | "External Audit"
  | "Compliance Audit";

export type AuditStatus =
  | "Planned"
  | "Scheduled"
  | "In Progress"
  | "Findings Review"
  | "Remediation"
  | "Completed"
  | "Cancelled"
  | "Overdue";

export type AuditPriority = "Critical" | "High" | "Medium" | "Low";

export type AuditFrequency = "One Time" | "Monthly" | "Quarterly" | "Half Yearly" | "Annual";

/** Matches the scope entity types an audit (or audit-scope row) can point at. */
export type AuditScopeType = "ASSET" | "APPLICATION" | "API" | "CLOUD_ASSET" | "BUSINESS_SERVICE" | "BUSINESS_UNIT";

export interface Audit {
  id: string;
  name: string;
  auditType: AuditType;
  description: string;
  status: AuditStatus;
  priority: AuditPriority;
  scopeType: AuditScopeType;
  scopeId: string;
  scopeName: string;
  businessUnit: string;
  owner: string;
  auditor: string;
  auditorEmail: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  frequency: AuditFrequency;
  lastAuditDate?: string;
  nextAuditDate?: string;
  riskLevel: BusinessCriticality;
  findingCount: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  createdDate: string;
}
