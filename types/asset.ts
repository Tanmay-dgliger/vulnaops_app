import type { BusinessCriticality, Environment } from "./vulnerability";

export type AssetType =
  | "Server"
  | "Application"
  | "Web Server"
  | "Database"
  | "API Gateway"
  | "Auth Service";

export type SlaStatus = "Breached" | "Due Soon" | "Within SLA";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  environment: Environment;
  applicationId: string;
  businessUnit: string;
  criticality: BusinessCriticality;
  ip: string;
  os: string;
  owner: string;
  lastScan: string;
  slaStatus: SlaStatus;
}
