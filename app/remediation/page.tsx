import RemediationBoard from "@/components/remediation/RemediationBoard";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RemediationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;

  return <RemediationBoard key={status ?? ""} initialStatus={status} />;
}
