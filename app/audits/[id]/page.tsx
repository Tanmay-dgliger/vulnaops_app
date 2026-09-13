import AuditDetail from "@/components/audits/AuditDetail";

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditDetail id={id} />;
}
