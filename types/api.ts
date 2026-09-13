import type { BusinessCriticality, Environment } from "./vulnerability";

export interface Api {
  id: string;
  name: string;
  applicationId: string;
  endpoint: string;
  method: string;
  environment: Environment;
  owner: string;
  criticality: BusinessCriticality;
  internetFacing: boolean;
  authentication: string;
  status: string;
  lastSeen: string;
}
