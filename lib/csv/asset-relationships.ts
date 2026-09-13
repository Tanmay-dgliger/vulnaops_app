import raw from "@/data/csv/asset-relationships.csv";
import { parseCsv } from "./parse";
import type { AssetRelationship, RelationshipEntityType, RelationshipType } from "@/types/asset-relationship";

export function getAssetRelationships(): AssetRelationship[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.relationshipId,
    sourceType: r.sourceType as RelationshipEntityType,
    sourceId: r.sourceId,
    sourceName: r.sourceName,
    relationshipType: r.relationshipType as RelationshipType,
    targetType: r.targetType as RelationshipEntityType,
    targetId: r.targetId,
    targetName: r.targetName,
    status: r.status,
  }));
}
