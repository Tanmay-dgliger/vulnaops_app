import type { BusinessCriticality, Environment } from "./vulnerability";

export interface CloudAsset {
  id: string;
  name: string;
  cloudProvider: string;
  accountId: string;
  region: string;
  resourceType: string;
  environment: Environment;
  businessUnit: string;
  owner: string;
  criticality: BusinessCriticality;
  internetFacing: boolean;
  status: string;
  discoverySource: string;
  lastSeen: string;
}
