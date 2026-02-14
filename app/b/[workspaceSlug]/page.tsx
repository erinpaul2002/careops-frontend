import PublicBooking from "@/components/PublicBooking";

interface PublicBookingPageProps {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function PublicBookingPage({ params }: PublicBookingPageProps) {
  const { workspaceSlug } = await params;
  return <PublicBooking workspaceId={workspaceSlug} />;
}
