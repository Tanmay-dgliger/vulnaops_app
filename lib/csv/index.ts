import { getUsers } from "./users";
import { getApplications } from "./applications";
import { getAssets } from "./assets";
import { getVulnerabilities } from "./vulnerabilities";
import { getRemediations } from "./remediations";
import { getExceptions } from "./exceptions";
import { getScannerImports } from "./scanner-imports";
import { getActivities } from "./activities";
import { getUserAccounts } from "./user-accounts";
import { getApis } from "./apis";
import { getCloudAssets } from "./cloud-assets";
import { getAssetRelationships } from "./asset-relationships";
import { getAssetDiscoveryRecords } from "./asset-discovery";

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
    userAccounts: getUserAccounts(),
    apis: getApis(),
    cloudAssets: getCloudAssets(),
    assetRelationships: getAssetRelationships(),
    assetDiscovery: getAssetDiscoveryRecords(),
  };
}

export type AppData = ReturnType<typeof loadAllData>;
