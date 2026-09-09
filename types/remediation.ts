export type RemediationStatus = "New" | "Assigned" | "In Progress" | "Validation" | "Closed";

export type ValidationResult = "Pending" | "Passed" | "Failed" | "Not Requested";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface RemediationComment {
  id: string;
  user: string;
  time: string;
  text: string;
}

export interface Evidence {
  id: string;
  name: string;
  size: string;
  date: string;
}

export interface Remediation {
  id: string;
  vulnerabilityId: string;
  action: string;
  owner: string;
  targetDate: string;
  opened: string;
  status: RemediationStatus;
  progress: number;
  validationResult: ValidationResult;
  lastScanDate?: string;
  lastScanResult?: string;
  checklist: ChecklistItem[];
  comments: RemediationComment[];
  evidence: Evidence[];
  changeRequest?: string;
  incident?: string;
}
