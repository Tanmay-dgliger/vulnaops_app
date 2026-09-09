import raw from "@/data/csv/applications.csv";
import { parseCsv } from "./parse";
import type { Application } from "@/types/application";
import type { BusinessCriticality } from "@/types/vulnerability";

export function getApplications(): Application[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    businessUnit: r.businessUnit,
    owner: r.owner,
    criticality: r.criticality as BusinessCriticality,
  }));
}
