import type { Audit, AuditStatus } from "@/types/audit";
import type { AuditScope } from "@/types/audit-scope";
import type { AuditFinding } from "@/types/audit-finding";
import { calculateAge } from "./sla";

const CLOSED_STATUSES = new Set<AuditStatus>(["Completed", "Cancelled"]);

/** An audit's *effective* status: the stored status, except a non-terminal audit whose
 *  planned end date has already passed is surfaced as Overdue (computed, not stored —
 *  same pattern as SLA-breach detection elsewhere in the app). */
export function calculateAuditStatus(audit: Audit, now: Date = new Date()): AuditStatus {
  if (CLOSED_STATUSES.has(audit.status)) return audit.status;
  if (new Date(audit.plannedEndDate).getTime() < now.getTime()) return "Overdue";
  return audit.status;
}

export function isAuditOverdue(audit: Audit, now: Date = new Date()): boolean {
  return calculateAuditStatus(audit, now) === "Overdue";
}

export function getAuditScopeItems(auditId: string, scopes: AuditScope[]): AuditScope[] {
  return scopes.filter((s) => s.auditId === auditId);
}

export function getAuditFindingsFor(auditId: string, findings: AuditFinding[]): AuditFinding[] {
  return findings.filter((f) => f.auditId === auditId);
}

export function getUpcomingAudits(audits: Audit[], now: Date = new Date(), withinDays = 60): Audit[] {
  return audits
    .filter((a) => !CLOSED_STATUSES.has(a.status) && calculateAuditStatus(a, now) !== "Overdue")
    .filter((a) => {
      const days = Math.ceil((new Date(a.plannedStartDate).getTime() - now.getTime()) / 86400000);
      return days >= 0 && days <= withinDays;
    })
    .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());
}

export function getOverdueAudits(audits: Audit[], now: Date = new Date()): Audit[] {
  return audits
    .filter((a) => calculateAuditStatus(a, now) === "Overdue")
    .sort((a, b) => new Date(a.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime());
}

export interface AuditHistoryEntry {
  audit: Audit;
  openFindings: number;
}

/** All audits whose scope (primary or additional scope rows) references this entity. */
export function getAuditHistory(scopeId: string, audits: Audit[], scopes: AuditScope[], findings: AuditFinding[]): AuditHistoryEntry[] {
  const auditIdsFromScope = new Set(scopes.filter((s) => s.scopeId === scopeId).map((s) => s.auditId));
  return audits
    .filter((a) => a.scopeId === scopeId || auditIdsFromScope.has(a.id))
    .map((audit) => ({
      audit,
      openFindings: getAuditFindingsFor(audit.id, findings).filter((f) => f.status !== "Closed" && f.status !== "Accepted Risk").length,
    }))
    .sort((a, b) => new Date(b.audit.plannedStartDate).getTime() - new Date(a.audit.plannedStartDate).getTime());
}

export interface AuditSummary {
  lastAuditDate?: string;
  nextAuditDate?: string;
  status?: AuditStatus;
  openFindings: number;
}

/** Summarizes an entity's audit posture for list/table columns: the most recently
 *  *completed* audit's actual end date (never a future planned date), the nearest
 *  upcoming audit's planned start date, and that upcoming audit's effective status
 *  (or the last completed audit's status if nothing is upcoming). */
export function getAuditSummary(scopeId: string, audits: Audit[], scopes: AuditScope[], findings: AuditFinding[], now: Date = new Date()): AuditSummary {
  const history = getAuditHistory(scopeId, audits, scopes, findings);
  if (history.length === 0) return { openFindings: 0 };

  const completed = history
    .filter((h) => h.audit.status === "Completed" && h.audit.actualEndDate)
    .sort((a, b) => new Date(b.audit.actualEndDate!).getTime() - new Date(a.audit.actualEndDate!).getTime());
  const upcoming = history
    .filter((h) => !CLOSED_STATUSES.has(h.audit.status))
    .sort((a, b) => new Date(a.audit.plannedStartDate).getTime() - new Date(b.audit.plannedStartDate).getTime());

  const lastCompleted = completed[0];
  const nextUpcoming = upcoming[0];

  return {
    lastAuditDate: lastCompleted?.audit.actualEndDate,
    nextAuditDate: nextUpcoming?.audit.plannedStartDate ?? lastCompleted?.audit.nextAuditDate,
    status: nextUpcoming ? calculateAuditStatus(nextUpcoming.audit, now) : lastCompleted?.audit.status,
    openFindings: history.reduce((sum, h) => sum + h.openFindings, 0),
  };
}

export interface AuditPriorityResult {
  priority: "Critical" | "High" | "Medium" | "Low";
  reasons: string[];
}

/** Deterministic, rule-based audit-priority recommendation — not an AI/ML model. */
export function calculateAuditPriority(input: {
  criticality?: string;
  internetFacing?: boolean;
  criticalFindings: number;
  highFindings: number;
  slaBreaches: number;
  lastAuditDate?: string;
  now?: Date;
}): AuditPriorityResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  let score = 0;

  if (input.criticality === "Critical") { score += 3; reasons.push("critical business importance"); }
  else if (input.criticality === "High") { score += 1; }

  if (input.internetFacing) { score += 2; reasons.push("internet exposure"); }

  if (input.criticalFindings > 0) { score += 3; reasons.push(`${input.criticalFindings} unresolved critical finding${input.criticalFindings > 1 ? "s" : ""}`); }
  if (input.highFindings > 0) { score += 1; reasons.push(`${input.highFindings} unresolved high finding${input.highFindings > 1 ? "s" : ""}`); }
  if (input.slaBreaches > 0) { score += 2; reasons.push(`${input.slaBreaches} SLA breach${input.slaBreaches > 1 ? "es" : ""}`); }

  let monthsSinceAudit: number | null = null;
  if (input.lastAuditDate) {
    monthsSinceAudit = Math.floor(calculateAge(input.lastAuditDate, now) / 30);
    if (monthsSinceAudit >= 12) { score += 2; reasons.push(`last audit ${monthsSinceAudit} months ago`); }
  } else {
    score += 2;
    reasons.push("no recent audit on record");
  }

  const priority: AuditPriorityResult["priority"] = score >= 7 ? "Critical" : score >= 4 ? "High" : score >= 2 ? "Medium" : "Low";

  return { priority, reasons };
}
