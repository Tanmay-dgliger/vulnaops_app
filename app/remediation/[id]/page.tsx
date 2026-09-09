import RemediationDetail from "@/components/remediation/RemediationDetail";

export default async function RemediationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RemediationDetail id={id} />;
}
