import VulnerabilityQueue from "@/components/vulnerabilities/VulnerabilityQueue";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VulnerabilitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const asString = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  const severity = asString(params.severity);
  const status = asString(params.status);
  const sla = asString(params.sla);

  return (
    // Force a remount whenever the URL's filter query changes: VulnerabilityQueue seeds
    // its filter state from these props via useState's lazy initializer, which only runs
    // on first mount. Without a key, client-side navigation between two /vulnerabilities
    // URLs (e.g. "All Vulnerabilities" -> "New / Untriaged") reuses the existing component
    // instance and the new initial* props are silently ignored, leaving the stale filter.
    <VulnerabilityQueue key={`${severity ?? ""}|${status ?? ""}|${sla ?? ""}`} initialSeverity={severity} initialStatus={status} initialSla={sla} />
  );
}
