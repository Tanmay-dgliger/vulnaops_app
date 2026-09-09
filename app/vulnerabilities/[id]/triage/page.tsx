import TriageWorkspace from "@/components/triage/TriageWorkspace";

export default async function TriagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TriageWorkspace id={id} />;
}
