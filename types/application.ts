import type { BusinessCriticality } from "./vulnerability";

export interface Application {
  id: string;
  name: string;
  businessUnit: string;
  owner: string;
  criticality: BusinessCriticality;
}
