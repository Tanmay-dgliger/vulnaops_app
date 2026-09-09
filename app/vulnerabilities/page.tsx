import VulnerabilityQueue from "@/components/vulnerabilities/VulnerabilityQueue";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VulnerabilitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const asString = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  return (
    <VulnerabilityQueue
      initialSeverity={asString(params.severity)}
      initialStatus={asString(params.status)}
      initialSla={asString(params.sla)}
    />
  );
}
