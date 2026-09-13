import AuditTable from "@/components/audits/AuditTable";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuditsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;

  return <AuditTable key={status ?? ""} initialStatus={status} />;
}
