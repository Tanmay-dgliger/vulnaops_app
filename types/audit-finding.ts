import type { VulnerabilitySeverity } from "./vulnerability";

export type AuditFindingStatus = "Open" | "Assigned" | "In Remediation" | "Pending Validation" | "Closed" | "Accepted Risk";

export const AUDIT_FINDING_CATEGORIES = [
  "Access Control",
  "Authentication",
  "Authorization",
  "Configuration",
  "Data Protection",
  "Logging & Monitoring",
  "Network Security",
  "Application Security",
  "API Security",
  "Cloud Security",
  "Patch Management",
  "Process / Governance",
] as const;

export type AuditFindingCategory = (typeof AUDIT_FINDING_CATEGORIES)[number];

export interface AuditFinding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  category: AuditFindingCategory | string;
  severity: VulnerabilitySeverity;
  status: AuditFindingStatus;
  assetId?: string;
  applicationId?: string;
  apiId?: string;
  owner?: string;
  assignedTo?: string;
  dueDate?: string;
  createdDate: string;
  riskScore: number;
  remediationId?: string;
}
