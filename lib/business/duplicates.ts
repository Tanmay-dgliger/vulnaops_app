import type { Vulnerability } from "@/types/vulnerability";

export interface DuplicateAttribute {
  attr: string;
  newVal: string;
  existingVal: string;
  match: boolean;
}

export interface DuplicateMatch {
  candidate: Vulnerability;
  confidence: number;
  matchedCount: number;
  totalCount: number;
  attributes: DuplicateAttribute[];
  matchedOn: string[];
}

/**
 * Deterministic duplicate-detection rule: primary key is CVE + Asset + Port + Protocol.
 * Returns comparison detail for the strongest match among other findings for the
 * same vulnerability record (excludes the finding itself and anything already
 * merged/marked duplicate).
 */
export function findDuplicates(vuln: Vulnerability, all: Vulnerability[]): DuplicateMatch | null {
  const candidates = all.filter(
    (v) =>
      v.id !== vuln.id &&
      !v.isDuplicate &&
      v.cve === vuln.cve &&
      v.assetId === vuln.assetId &&
      v.port === vuln.port &&
      v.protocol === vuln.protocol
  );

  if (candidates.length === 0) return null;

  // Prefer the earliest-seen candidate as the "existing" finding to merge into.
  const existing = candidates.sort((a, b) => (a.firstSeen < b.firstSeen ? -1 : 1))[0];

  const attributes: DuplicateAttribute[] = [
    { attr: "CVE ID", newVal: vuln.cve, existingVal: existing.cve, match: vuln.cve === existing.cve },
    { attr: "Asset", newVal: vuln.assetId, existingVal: existing.assetId, match: vuln.assetId === existing.assetId },
    { attr: "Port", newVal: String(vuln.port ?? "—"), existingVal: String(existing.port ?? "—"), match: vuln.port === existing.port },
    { attr: "Protocol", newVal: vuln.protocol ?? "—", existingVal: existing.protocol ?? "—", match: vuln.protocol === existing.protocol },
    { attr: "Scanner", newVal: vuln.scanner, existingVal: existing.scanner, match: vuln.scanner === existing.scanner },
    { attr: "First Seen", newVal: vuln.firstSeen, existingVal: existing.firstSeen, match: vuln.firstSeen === existing.firstSeen },
    { attr: "CVSS Score", newVal: String(vuln.cvss), existingVal: String(existing.cvss), match: vuln.cvss === existing.cvss },
    { attr: "Severity", newVal: vuln.severity, existingVal: existing.severity, match: vuln.severity === existing.severity },
  ];

  const matchedCount = attributes.filter((a) => a.match).length;
  const confidence = Math.round((matchedCount / attributes.length) * 100);

  return {
    candidate: existing,
    confidence,
    matchedCount,
    totalCount: attributes.length,
    attributes,
    matchedOn: attributes.filter((a) => a.match).map((a) => a.attr),
  };
}
