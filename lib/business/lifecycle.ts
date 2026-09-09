import type { Vulnerability } from "@/types/vulnerability";

export interface LifecycleStage {
  label: string;
  count: number;
  pct: number;
}

/** Funnel view of where findings sit in the triage -> remediation -> closure pipeline. */
export function getLifecycleStages(vulns: Vulnerability[]): LifecycleStage[] {
  const total = vulns.length || 1;
  const triaged = vulns.filter((v) => v.status !== "New").length;
  const assigned = vulns.filter((v) => ["Assigned", "Remediating", "Validation", "Closed"].includes(v.status)).length;
  const remediating = vulns.filter((v) => ["Remediating", "Validation", "Closed"].includes(v.status)).length;
  const validation = vulns.filter((v) => ["Validation", "Closed"].includes(v.status)).length;
  const closed = vulns.filter((v) => v.status === "Closed").length;

  const stages = [
    { label: "Scanned", count: vulns.length },
    { label: "Triaged", count: triaged },
    { label: "Assigned", count: assigned },
    { label: "Remediating", count: remediating },
    { label: "Validation", count: validation },
    { label: "Closed", count: closed },
  ];

  return stages.map((s) => ({ ...s, pct: Math.round((s.count / total) * 1000) / 10 }));
}
