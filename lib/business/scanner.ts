import type { FindingType } from "@/types/vulnerability";

/** Maps each demo scanner/tool to the finding type it produces. Finding Type (VAPT/SAST/DAST)
 *  is the taxonomy; Scanner/Tool (Qualys, SonarQube, ...) is the product that produced it. */
export const SCANNER_FINDING_TYPE: Record<string, FindingType> = {
  Qualys: "VAPT",
  Nessus: "VAPT",
  Tenable: "VAPT",
  Rapid7: "VAPT",
  SonarQube: "SAST",
  "OWASP ZAP": "DAST",
  Snyk: "SCA",
  Mend: "SCA",
  "OWASP Dependency-Check": "SCA",
};

export function getFindingTypeForScanner(scanner: string): FindingType {
  return SCANNER_FINDING_TYPE[scanner] ?? "VAPT";
}
