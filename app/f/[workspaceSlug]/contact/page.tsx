import PublicContact from "@/components/PublicContact";

interface PublicContactPageProps {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function PublicContactPage({ params }: PublicContactPageProps) {
  const { workspaceSlug } = await params;
  return <PublicContact workspaceId={workspaceSlug} />;
}
