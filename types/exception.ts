export type ExceptionType =
  | "False Positive"
  | "Accepted Risk"
  | "Compensating Control"
  | "Deferred Remediation";

export type ExceptionStatus = "Pending Approval" | "Approved" | "Rejected" | "More Info Requested";

export interface Exception {
  id: string;
  vulnerabilityId: string;
  type: ExceptionType;
  status: ExceptionStatus;
  reason: string;
  justification: string;
  compensatingControls: string[];
  requestedBy: string;
  approvedBy?: string;
  validFrom: string;
  validUntil: string;
}
