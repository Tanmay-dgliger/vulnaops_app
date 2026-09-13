import raw from "@/data/csv/applications.csv";
import { parseCsv, toOptional } from "./parse";
import type { Application } from "@/types/application";
import type { BusinessCriticality, Environment } from "@/types/vulnerability";

export function getApplications(): Application[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    businessUnit: r.businessUnit,
    owner: r.owner,
    criticality: r.criticality as BusinessCriticality,
    businessService: toOptional(r.businessService),
    environment: toOptional(r.environment) as Environment | undefined,
    repository: toOptional(r.repository),
    repositoryUrl: toOptional(r.repositoryUrl),
    technology: toOptional(r.technology),
    status: toOptional(r.status),
    lastUpdated: toOptional(r.lastUpdated),
  }));
}
