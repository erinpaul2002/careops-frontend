"use client";

import OnboardingUI from "@/components/Onboarding/OnboardingUI";
import { useOnboarding } from "@/components/Onboarding/useOnboarding";

interface OnboardingProps {
  basePath?: string;
}

export default function Onboarding({ basePath = "" }: OnboardingProps) {
  const {
    loading,
    error,
    steps,
    activeStepIndex,
    blockers,
    warnings,
    canActivate,
    activating,
    workspaceStatus,
    activationMessage,
    completion,
    onActivate,
    onGoToDashboard,
    onRefresh,
    onSelectStep,
    onNextStep,
    onPreviousStep,
  } = useOnboarding({ basePath });

  return (
    <OnboardingUI
      loading={loading}
      error={error}
      steps={steps}
      activeStepIndex={activeStepIndex}
      blockers={blockers}
      warnings={warnings}
      canActivate={canActivate}
      activating={activating}
      workspaceStatus={workspaceStatus}
      activationMessage={activationMessage}
      completion={completion}
      onActivate={onActivate}
      onGoToDashboard={onGoToDashboard}
      onRefresh={onRefresh}
      onSelectStep={onSelectStep}
      onNextStep={onNextStep}
      onPreviousStep={onPreviousStep}
    />
  );
}
