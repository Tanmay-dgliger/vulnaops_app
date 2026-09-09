import raw from "@/data/csv/remediations.csv";
import { parseCsv, parseJsonArray, toNum, toOptional } from "./parse";
import type {
  ChecklistItem,
  Evidence,
  Remediation,
  RemediationComment,
  RemediationStatus,
  ValidationResult,
} from "@/types/remediation";

export function getRemediations(): Remediation[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.id,
    vulnerabilityId: r.vulnerabilityId,
    action: r.action,
    owner: r.owner,
    targetDate: r.targetDate,
    opened: r.opened,
    status: r.status as RemediationStatus,
    progress: toNum(r.progress),
    validationResult: r.validationResult as ValidationResult,
    lastScanDate: toOptional(r.lastScanDate),
    lastScanResult: toOptional(r.lastScanResult),
    checklist: parseJsonArray<ChecklistItem>(r.checklist),
    comments: parseJsonArray<RemediationComment>(r.comments),
    evidence: parseJsonArray<Evidence>(r.evidence),
    changeRequest: toOptional(r.changeRequest),
    incident: toOptional(r.incident),
  }));
}
