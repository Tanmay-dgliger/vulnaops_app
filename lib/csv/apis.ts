import raw from "@/data/csv/apis.csv";
import { parseCsv, toBool } from "./parse";
import type { Api } from "@/types/api";
import type { BusinessCriticality, Environment } from "@/types/vulnerability";

export function getApis(): Api[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.apiId,
    name: r.apiName,
    applicationId: r.applicationId,
    endpoint: r.endpoint,
    method: r.method,
    environment: r.environment as Environment,
    owner: r.owner,
    criticality: r.criticality as BusinessCriticality,
    internetFacing: toBool(r.internetFacing),
    authentication: r.authentication,
    status: r.status,
    lastSeen: r.lastSeen,
  }));
}
