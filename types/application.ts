import type { BusinessCriticality, Environment } from "./vulnerability";

export interface Application {
  id: string;
  name: string;
  businessUnit: string;
  owner: string;
  criticality: BusinessCriticality;

  // Inventory/CMDB-oriented fields — optional so existing records keep working.
  businessService?: string;
  environment?: Environment;
  repository?: string;
  repositoryUrl?: string;
  technology?: string;
  status?: string;
  lastUpdated?: string;
}
