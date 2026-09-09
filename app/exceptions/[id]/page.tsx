import ExceptionDetail from "@/components/exceptions/ExceptionDetail";

export default async function ExceptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExceptionDetail id={id} />;
}
