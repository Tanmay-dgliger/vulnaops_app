export type ActionType =
  | "status_changed"
  | "assigned"
  | "triage_completed"
  | "import"
  | "false_positive"
  | "exception_approved"
  | "exception_rejected"
  | "merged"
  | "revalidation"
  | "comment"
  | "severity_override"
  | "sla_breach"
  | "validated"
  | "closed";

export type EntityType = "CVE" | "Asset" | "Import" | "Exception" | "Remediation" | "System";

export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: ActionType;
  entity: string;
  entityType: EntityType;
  from?: string;
  to?: string;
  detail?: string;
  severity?: "Critical" | "High" | "Medium" | "Low";
  ip: string;
}
