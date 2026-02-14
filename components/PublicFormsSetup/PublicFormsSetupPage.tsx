"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import PublicFormsSetupUI from "@/components/PublicFormsSetup/PublicFormsSetupUI";
import type { PublicSetupModule } from "@/components/PublicFormsSetup/types";
import { usePublicFormsSetup } from "@/components/PublicFormsSetup/usePublicFormsSetup";

interface PublicFormsSetupPageProps {
  module: PublicSetupModule;
  basePath?: string;
}

export default function PublicFormsSetupPage({
  module,
  basePath = "/setup",
}: PublicFormsSetupPageProps) {
  const setup = usePublicFormsSetup();
  const router = useRouter();
  const normalizedBasePath = basePath.replace(/\/$/, "");

  const onModuleChange = useCallback(
    (nextModule: PublicSetupModule) => {
      router.push(`${normalizedBasePath}/${nextModule}`);
    },
    [normalizedBasePath, router],
  );

  return (
    <PublicFormsSetupUI
      {...setup}
      activeModule={module}
      onModuleChange={onModuleChange}
    />
  );
}
