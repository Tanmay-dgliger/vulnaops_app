import { readCsv } from "./parse";
import type { Application } from "@/types/application";
import type { BusinessCriticality } from "@/types/vulnerability";

export function getApplications(): Application[] {
  const rows = readCsv<Record<string, string>>("applications.csv");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    businessUnit: r.businessUnit,
    owner: r.owner,
    criticality: r.criticality as BusinessCriticality,
  }));
}
