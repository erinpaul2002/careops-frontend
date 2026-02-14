import PublicForm from "@/components/PublicForm";

interface PublicFormPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { token } = await params;
  return <PublicForm token={token} />;
}
