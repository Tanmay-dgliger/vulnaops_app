import raw from "@/data/csv/exceptions.csv";
import { parseCsv, parsePipeList, toOptional } from "./parse";
import type { Exception, ExceptionStatus, ExceptionType } from "@/types/exception";

export function getExceptions(): Exception[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.id,
    vulnerabilityId: r.vulnerabilityId,
    type: r.type as ExceptionType,
    status: r.status as ExceptionStatus,
    reason: r.reason,
    justification: r.justification,
    compensatingControls: parsePipeList(r.compensatingControls),
    requestedBy: r.requestedBy,
    approvedBy: toOptional(r.approvedBy),
    validFrom: r.validFrom,
    validUntil: r.validUntil,
  }));
}
