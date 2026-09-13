export type RelationshipEntityType = "APPLICATION" | "ASSET" | "API" | "CLOUD_ASSET" | "REPOSITORY" | "DEPENDENCY" | "DATABASE";

export type RelationshipType =
  | "HOSTS"
  | "RUNS_ON"
  | "DEPENDS_ON"
  | "EXPOSES"
  | "CONNECTS_TO"
  | "PART_OF"
  | "USES"
  | "DEPLOYED_ON";

export interface AssetRelationship {
  id: string;
  sourceType: RelationshipEntityType;
  sourceId: string;
  sourceName: string;
  relationshipType: RelationshipType;
  targetType: RelationshipEntityType;
  targetId: string;
  targetName: string;
  status: string;
}
