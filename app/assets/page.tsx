import AssetTable from "@/components/assets/AssetTable";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const asString = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  const criticality = asString(params.criticality);
  const status = asString(params.status);
  const applicationId = asString(params.applicationId);

  return (
    <AssetTable
      key={`${criticality ?? ""}|${status ?? ""}|${applicationId ?? ""}`}
      initialCriticality={criticality}
      initialStatus={status}
      initialApplicationId={applicationId}
    />
  );
}
