import { readCsv, toOptional } from "./parse";
import type { ActionType, Activity, EntityType } from "@/types/activity";

export function getActivities(): Activity[] {
  const rows = readCsv<Record<string, string>>("activities.csv");
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    user: r.user,
    userRole: r.userRole,
    action: r.action as ActionType,
    entity: r.entity,
    entityType: r.entityType as EntityType,
    from: toOptional(r.from),
    to: toOptional(r.to),
    detail: toOptional(r.detail),
    severity: toOptional(r.severity) as Activity["severity"],
    ip: r.ip,
  }));
}
