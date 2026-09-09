import type { BusinessCriticality, DataSensitivity } from "@/types/vulnerability";

const CRITICALITY_ADJ: Record<BusinessCriticality, number> = {
  Critical: 0,
  High: -4,
  Medium: -10,
  Low: -18,
};

const SENSITIVITY_ADJ: Record<DataSensitivity, number> = {
  High: 0,
  Medium: -3,
  Low: -6,
};

/**
 * Demo/illustrative composite risk score (0-100), not a certified methodology.
 * Weighted from CVSS plus business context. Tuned so the reference scenario
 * (CVSS 9.8, Critical criticality, internet-exposed, exploit available,
 * High sensitivity) lands on 96, matching the design's displayed value.
 */
export function calculateRiskScore(
  cvss: number,
  businessCriticality: BusinessCriticality,
  internetExposed: boolean,
  exploitAvailable: boolean,
  dataSensitivity: DataSensitivity
): number {
  let score = cvss * 10;
  score += CRITICALITY_ADJ[businessCriticality];
  score += internetExposed ? 0 : -6;
  score += exploitAvailable ? 0 : -8;
  score += SENSITIVITY_ADJ[dataSensitivity];
  score -= 2;
  return Math.max(1, Math.min(99, Math.round(score)));
}
