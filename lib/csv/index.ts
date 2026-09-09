import { getUsers } from "./users";
import { getApplications } from "./applications";
import { getAssets } from "./assets";
import { getVulnerabilities } from "./vulnerabilities";
import { getRemediations } from "./remediations";
import { getExceptions } from "./exceptions";
import { getScannerImports } from "./scanner-imports";
import { getActivities } from "./activities";

export function loadAllData() {
  return {
    users: getUsers(),
    applications: getApplications(),
    assets: getAssets(),
    vulnerabilities: getVulnerabilities(),
    remediations: getRemediations(),
    exceptions: getExceptions(),
    scannerImports: getScannerImports(),
    activities: getActivities(),
  };
}

export type AppData = ReturnType<typeof loadAllData>;
