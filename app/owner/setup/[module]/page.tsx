import { PublicFormsSetupPage } from "@/components/PublicFormsSetup";
import type { PublicSetupModule } from "@/components/PublicFormsSetup/types";
import { notFound } from "next/navigation";

interface OwnerSetupModulePageProps {
  params: Promise<{ module: string }>;
}

const allowedModules = new Set<PublicSetupModule>([
  "services",
  "templates",
  "trigger",
  "fields",
]);

export default async function OwnerSetupModulePage({ params }: OwnerSetupModulePageProps) {
  const { module } = await params;
  if (!allowedModules.has(module as PublicSetupModule)) {
    notFound();
  }

  return <PublicFormsSetupPage module={module as PublicSetupModule} basePath="/owner/setup" />;
}
