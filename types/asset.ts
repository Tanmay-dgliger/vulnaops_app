import type { BusinessCriticality, Environment } from "./vulnerability";

export type AssetType =
  | "Server"
  | "Application"
  | "Web Server"
  | "Database"
  | "API Gateway"
  | "Auth Service"
  | "Endpoint"
  | "Network Device"
  | "Container"
  | "Cloud Asset";

export type SlaStatus = "Breached" | "Due Soon" | "Within SLA";

export type AssetStatus = "Active" | "Inactive" | "Decommissioned" | "Unmanaged";

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

  // Asset Inventory / discovery-oriented fields — optional so existing records keep working.
  assetSubType?: string;
  hostname?: string;
  fqdn?: string;
  ownerEmail?: string;
  status?: AssetStatus;
  internetFacing?: boolean;
  discoverySource?: string;
  firstSeen?: string;
  lastSeen?: string;
  cloudProvider?: string;
  cloudAccount?: string;
  region?: string;
  location?: string;
  businessService?: string;
  description?: string;
}
