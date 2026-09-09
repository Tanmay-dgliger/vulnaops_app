import type { Vulnerability, VulnerabilitySeverity } from "@/types/vulnerability";

export const SLA_DAYS: Record<VulnerabilitySeverity, number> = {
  Critical: 7,
  High: 15,
  Medium: 30,
  Low: 60,
};

export type SlaState = "Within SLA" | "Due Soon" | "Breached";

export interface SlaInfo {
  state: SlaState;
  dueDate: string;
  daysRemaining: number;
  label: string;
}

/** Days elapsed since an ISO date string (YYYY-MM-DD), relative to "now". */
export function calculateAge(dateStr: string, now: Date = new Date()): number {
  const then = new Date(dateStr).getTime();
  const diffMs = now.getTime() - then;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Computes SLA status for a vulnerability. Closed/False Positive/Accepted Risk
 * findings are not subject to an active SLA clock.
 */
export function calculateSlaStatus(
  severity: VulnerabilitySeverity,
  firstSeen: string,
  status: Vulnerability["status"],
  now: Date = new Date()
): SlaInfo {
  const dueDate = addDays(firstSeen, SLA_DAYS[severity]);
  const dueTime = new Date(dueDate).getTime();
  const daysRemaining = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));

  const isClosed = status === "Closed" || status === "False Positive" || status === "Accepted Risk";

  if (isClosed) {
    return { state: "Within SLA", dueDate, daysRemaining, label: `Closed ${dueDate}` };
  }

  if (daysRemaining < 0) {
    return { state: "Breached", dueDate, daysRemaining, label: `${Math.abs(daysRemaining)} days overdue` };
  }
  if (daysRemaining <= 3) {
    return { state: "Due Soon", dueDate, daysRemaining, label: `${daysRemaining} days left` };
  }
  return { state: "Within SLA", dueDate, daysRemaining, label: `${daysRemaining} days left` };
}
