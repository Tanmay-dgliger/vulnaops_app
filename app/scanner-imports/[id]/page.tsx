import ImportDetail from "@/components/scanner-imports/ImportDetail";

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ImportDetail id={id} />;
}
