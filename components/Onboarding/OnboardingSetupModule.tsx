"use client";

import { useCallback } from "react";
import PublicFormsSetupUI from "@/components/PublicFormsSetup/PublicFormsSetupUI";
import type { PublicSetupModule } from "@/components/PublicFormsSetup/types";
import { usePublicFormsSetup } from "@/components/PublicFormsSetup/usePublicFormsSetup";

interface OnboardingSetupModuleProps {
  module: PublicSetupModule;
}

export default function OnboardingSetupModule({ module }: OnboardingSetupModuleProps) {
  const setup = usePublicFormsSetup();

  const onModuleChange = useCallback(() => {
    // Module is locked by the current onboarding step.
  }, []);

  return (
    <PublicFormsSetupUI
      {...setup}
      activeModule={module}
      onModuleChange={onModuleChange}
      moduleNavigation="disabled"
    />
  );
}
