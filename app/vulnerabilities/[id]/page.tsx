import VulnerabilityDetail from "@/components/vulnerabilities/VulnerabilityDetail";

export default async function VulnerabilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VulnerabilityDetail id={id} />;
}
