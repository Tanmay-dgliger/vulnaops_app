import raw from "@/data/csv/activities.csv";
import { parseCsv, toOptional } from "./parse";
import type { ActionType, Activity, EntityType } from "@/types/activity";

export function getActivities(): Activity[] {
  const rows = parseCsv<Record<string, string>>(raw);
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
