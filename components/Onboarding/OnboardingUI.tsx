"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  RefreshCw,
  Rocket,
} from "lucide-react";
import Inventory from "@/components/Inventory";
import OnboardingSetupModule from "@/components/Onboarding/OnboardingSetupModule";
import SettingsIntegrations from "@/components/SettingsIntegrations";
import StaffManagement from "@/components/StaffManagement";
import type { OnboardingStep } from "@/components/Onboarding/types";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OnboardingUIProps } from "@/components/Onboarding/types";

function renderInlineStepSetup(stepKey: OnboardingStep["key"]) {
  if (stepKey === "workspace") {
    return (
      <div
        className="rounded-md border px-4 py-3 text-sm"
        style={{ borderColor: "#2563EB30", background: "#EFF6FF", color: "#1E3A8A" }}
      >
        <p className="font-medium">Workspace profile ready</p>
        <p className="mt-1">
          Name, timezone, and contact email come from signup. Continue with channels, bookings, and operations setup below.
        </p>
      </div>
    );
  }
  if (stepKey === "channels") {
    return <SettingsIntegrations />;
  }
  if (stepKey === "contact_form") {
    return <OnboardingSetupModule module="fields" />;
  }
  if (stepKey === "bookings") {
    return <OnboardingSetupModule module="services" />;
  }
  if (stepKey === "forms") {
    return <OnboardingSetupModule module="templates" />;
  }
  if (stepKey === "inventory") {
    return <Inventory />;
  }
  if (stepKey === "staff") {
    return <StaffManagement />;
  }
  return null;
}

export default function OnboardingUI({
  loading,
  steps,
  activeStepIndex,
  error,
  warnings,
  blockers,
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
}: OnboardingUIProps) {
  const safeActiveStepIndex = Math.min(
    Math.max(activeStepIndex, 0),
    Math.max(steps.length - 1, 0),
  );
  const currentStep = steps[safeActiveStepIndex] ?? null;
  const isActivationStep = currentStep?.key === "activation_review";
  const isFirstStep = safeActiveStepIndex <= 0;
  const isLastStep = safeActiveStepIndex >= steps.length - 1;
  const canGoToDashboard = isActivationStep && workspaceStatus === "active";
  const nextBlockedByChannels =
    currentStep?.key === "channels" && !currentStep.completed;
  const remainingSteps = steps.filter((step) => !step.completed).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Onboarding Guide</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Workspace Onboarding
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            tone={workspaceStatus === "active" ? "success" : "neutral"}
            label={`Status: ${workspaceStatus}`}
          />
          <StatusBadge
            tone={completion === 100 ? "success" : "warning"}
            label={`${completion}% complete`}
          />
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading || activating}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-60"
            style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#00AA6C" }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="fault-line" />

      {error ? (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#EF444440", background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      ) : null}
      {activationMessage ? (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#00AA6C40", background: "#ECFDF5", color: "#065F46" }}>
          {activationMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="panel p-3">
          <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "#5A6A7A" }}>
            Step Progress
          </p>
          <div className="mt-3 space-y-2">
            {steps.map((step, index) => {
              const isCurrent = index === safeActiveStepIndex;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => onSelectStep(index)}
                  className="flex w-full items-start justify-between gap-2 rounded-md border px-3 py-2.5 text-left transition-all duration-200"
                  style={
                    isCurrent
                      ? { borderColor: "#00AA6C", background: "#ECFDF5" }
                      : { borderColor: "var(--border)", background: "#ffffff" }
                  }
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#1A1A1A" }}>
                      {step.label}
                    </p>
                  </div>
                  <span className="pt-0.5">
                    {step.completed ? (
                      <CheckCircle2 size={15} style={{ color: "#00AA6C" }} />
                    ) : (
                      <CircleDashed size={15} style={{ color: "#5A6A7A" }} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs" style={{ color: "#5A6A7A" }}>
            {remainingSteps === 0
              ? "All steps complete."
              : `${remainingSteps} step${remainingSteps === 1 ? "" : "s"} remaining.`}
          </p>
        </aside>

        <section className="panel p-4">
          {currentStep ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
                  {currentStep.label}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
                  {currentStep.detail}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={currentStep.completed ? "success" : "warning"}
                  label={currentStep.completed ? "Completed" : "Pending"}
                />
                <StatusBadge
                  tone="neutral"
                  label={`Step ${safeActiveStepIndex + 1} of ${steps.length}`}
                />
              </div>

              {isActivationStep ? (
                <div className="space-y-3">
                  {workspaceStatus === "draft" ? (
                    <button
                      type="button"
                      onClick={() => void onActivate()}
                      disabled={activating || loading || !canActivate}
                      className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                      style={{ background: "#00AA6C", color: "#ffffff" }}
                    >
                      <Rocket size={15} />
                      {activating ? "Activating" : "Activate Workspace"}
                    </button>
                  ) : (
                    <StatusBadge tone="success" label="Workspace is live" />
                  )}

                  {!canActivate && blockers.length ? (
                    <div className="rounded-md border px-3 py-3 text-sm" style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}>
                      <p className="font-medium">Complete the remaining steps before activation:</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {renderInlineStepSetup(currentStep.key)}
                </div>
              )}

              {warnings.length ? (
                <div className="rounded-md border px-3 py-3 text-sm" style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}>
                  <p className="font-medium">Readiness warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={onPreviousStep}
                  disabled={isFirstStep}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={canGoToDashboard ? onGoToDashboard : onNextStep}
                  disabled={canGoToDashboard ? false : isLastStep || nextBlockedByChannels}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                  style={{ background: "#2563EB", color: "#ffffff" }}
                >
                  {canGoToDashboard ? "Go to Dashboard" : "Next"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#5A6A7A" }}>
              Onboarding steps are not available.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
