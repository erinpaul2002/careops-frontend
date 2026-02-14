"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  activateWorkspace,
  getMe,
  getWorkspaceReadiness,
  patchOnboardingSteps,
} from "@/lib/api/client";
import { getSessionState } from "@/lib/session";
import type { OnboardingState, OnboardingStep } from "@/components/Onboarding/types";
import type { WorkspaceReadiness } from "@/lib/api/types";

type OnboardingStepKey = OnboardingStep["key"];
type StepCompletionMap = Record<OnboardingStepKey, boolean>;

interface UseOnboardingOptions {
  basePath?: string;
}

interface EvaluateOnboardingResult {
  steps: OnboardingStep[];
  syncFailed: boolean;
  workspaceStatus: "draft" | "active";
  blockers: string[];
  warnings: string[];
  canActivate: boolean;
}

const CONTACT_FORM_ACK_STORAGE_KEY = "careops:onboarding:contact-form-ack";

function readContactFormAck(workspaceId: string | null): boolean {
  if (!workspaceId || typeof window === "undefined") {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(CONTACT_FORM_ACK_STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(parsed[workspaceId]);
  } catch {
    return false;
  }
}

function writeContactFormAck(workspaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const raw = window.localStorage.getItem(CONTACT_FORM_ACK_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    parsed[workspaceId] = true;
    window.localStorage.setItem(CONTACT_FORM_ACK_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Best effort persistence only.
  }
}

function createOnboardingStepDefinitions(): Array<Omit<OnboardingStep, "completed">> {
  return [
    {
      key: "workspace",
      label: "Step 1: Create Workspace",
      detail:
        "Business name, timezone, address, and contact email are captured during signup.",
    },
    {
      key: "channels",
      label: "Step 2: Set Up Integrations",
      detail:
        "Connect both Gmail and Google Calendar so confirmations, reminders, and booking sync can run.",
    },
    {
      key: "contact_form",
      label: "Step 3: Create Contact Form",
      detail:
        "Configure public contact fields so leads can submit inquiries successfully.",
    },
    {
      key: "bookings",
      label: "Step 4: Set Up Bookings",
      detail:
        "Create active services and availability so the public booking page can accept appointments.",
    },
    {
      key: "forms",
      label: "Step 5: Set Up Forms",
      detail:
        "Prepare post-booking form templates so follow-up intake can run automatically.",
    },
    {
      key: "inventory",
      label: "Step 6: Set Up Inventory",
      detail:
        "Add baseline inventory items and thresholds for low-stock monitoring.",
    },
    {
      key: "staff",
      label: "Step 7: Add Staff & Permissions",
      detail:
        "Invite staff users and assign permissions so owners are not the only operators.",
    },
    {
      key: "activation_review",
      label: "Step 8: Activate Workspace",
      detail:
        "Run final readiness checks and activate the workspace to go live.",
    },
  ];
}

function buildSteps(
  definitions: Array<Omit<OnboardingStep, "completed">>,
  completion: StepCompletionMap,
): OnboardingStep[] {
  return definitions.map((step) => ({
    ...step,
    completed: completion[step.key],
  }));
}

function createEmptyCompletionMap(): StepCompletionMap {
  return {
    workspace: false,
    channels: false,
    contact_form: false,
    bookings: false,
    forms: false,
    inventory: false,
    staff: false,
    activation_review: false,
  };
}

function completionFromReadiness(
  readiness: WorkspaceReadiness,
  stepKeys: OnboardingStepKey[],
): StepCompletionMap {
  const completion = createEmptyCompletionMap();
  for (const key of stepKeys) {
    completion[key] = Boolean(readiness.completion?.[key]);
  }
  return completion;
}

function hasOnboardingDrift(
  current: Record<string, boolean> | undefined,
  next: StepCompletionMap,
  stepKeys: OnboardingStepKey[],
): boolean {
  return stepKeys.some((key) => Boolean(current?.[key]) !== next[key]);
}

function findFirstIncompleteIndex(steps: OnboardingStep[]): number {
  const nextIndex = steps.findIndex((step) => !step.completed);
  return nextIndex === -1 ? Math.max(steps.length - 1, 0) : nextIndex;
}

function resolveActiveStepIndex(currentIndex: number, steps: OnboardingStep[]): number {
  if (!steps.length) {
    return 0;
  }

  const maxIndex = steps.length - 1;
  const boundedIndex = Math.min(Math.max(currentIndex, 0), maxIndex);
  if (!steps[boundedIndex]?.completed) {
    return boundedIndex;
  }

  return findFirstIncompleteIndex(steps);
}

function createInitialState(
  definitions: Array<Omit<OnboardingStep, "completed">>,
): OnboardingState {
  return {
    loading: true,
    error: null,
    steps: buildSteps(definitions, createEmptyCompletionMap()),
    activeStepIndex: 0,
    blockers: [],
    warnings: [],
    canActivate: false,
    activating: false,
    workspaceStatus: "draft",
    activationMessage: null,
  };
}

export function useOnboarding({ basePath = "" }: UseOnboardingOptions = {}) {
  const router = useRouter();
  const normalizedBasePath = useMemo(() => basePath.replace(/\/$/, ""), [basePath]);
  const dashboardPath = normalizedBasePath ? `${normalizedBasePath}/dashboard` : "/owner/dashboard";
  const stepDefinitions = useMemo(() => createOnboardingStepDefinitions(), []);
  const onboardingStepKeys = useMemo(
    () => stepDefinitions.map((step) => step.key) as OnboardingStepKey[],
    [stepDefinitions],
  );

  const [state, setState] = useState<OnboardingState>(() =>
    createInitialState(stepDefinitions),
  );
  const [contactFormAcknowledged, setContactFormAcknowledged] = useState(false);

  useEffect(() => {
    setState(createInitialState(stepDefinitions));
  }, [stepDefinitions]);

  useEffect(() => {
    const workspaceId = getSessionState().workspaceId ?? null;
    setContactFormAcknowledged(readContactFormAck(workspaceId));
  }, []);

  const evaluateOnboarding = useCallback(async (): Promise<EvaluateOnboardingResult> => {
    const session = getSessionState();
    const workspaceId = session.workspaceId;

    if (!workspaceId) {
      return {
        steps: buildSteps(stepDefinitions, createEmptyCompletionMap()),
        syncFailed: false,
        workspaceStatus: "draft",
        blockers: ["Workspace is not available in current session."],
        warnings: [],
        canActivate: false,
      };
    }

    const [mePayload, readiness] = await Promise.all([getMe(), getWorkspaceReadiness()]);

    const workspace = mePayload.workspaces.find((item) => item.id === workspaceId);
    const completion = completionFromReadiness(readiness, onboardingStepKeys);

    let syncFailed = false;
    if (hasOnboardingDrift(workspace?.onboardingSteps, completion, onboardingStepKeys)) {
      try {
        await patchOnboardingSteps(workspaceId, completion);
      } catch {
        syncFailed = true;
      }
    }

    const workspaceStatus = (workspace?.onboardingStatus ?? readiness.onboardingStatus ?? "draft") as
      | "draft"
      | "active";
    if (workspaceStatus === "draft" && !contactFormAcknowledged) {
      completion.contact_form = false;
    }

    return {
      steps: buildSteps(stepDefinitions, completion),
      syncFailed,
      workspaceStatus,
      blockers: readiness.blockers ?? [],
      warnings: readiness.warnings ?? [],
      canActivate: Boolean(readiness.canActivate),
    };
  }, [contactFormAcknowledged, onboardingStepKeys, stepDefinitions]);

  const refreshOnboarding = useCallback(
    async ({
      withLoading = true,
      clearMessage = false,
    }: {
      withLoading?: boolean;
      clearMessage?: boolean;
    } = {}): Promise<OnboardingStep[] | null> => {
      if (withLoading) {
        setState((previous) => ({
          ...previous,
          loading: true,
          error: null,
          activationMessage: clearMessage ? null : previous.activationMessage,
        }));
      }

      try {
        const result = await evaluateOnboarding();
        setState((previous) => ({
          ...previous,
          loading: false,
          steps: result.steps,
          activeStepIndex: resolveActiveStepIndex(previous.activeStepIndex, result.steps),
          workspaceStatus: result.workspaceStatus,
          blockers: result.blockers,
          warnings: result.warnings,
          canActivate: result.canActivate,
          error: result.syncFailed
            ? "Checklist updated locally but backend sync failed. Activation may fail until sync succeeds."
            : null,
          activationMessage: clearMessage ? null : previous.activationMessage,
        }));
        return result.steps;
      } catch {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: "Could not load onboarding checklist from workspace data.",
          activationMessage: clearMessage ? null : previous.activationMessage,
        }));
        return null;
      }
    },
    [evaluateOnboarding],
  );

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const result = await evaluateOnboarding();
        if (!active) {
          return;
        }
        setState((previous) => ({
          ...previous,
          loading: false,
          steps: result.steps,
          activeStepIndex: resolveActiveStepIndex(previous.activeStepIndex, result.steps),
          workspaceStatus: result.workspaceStatus,
          blockers: result.blockers,
          warnings: result.warnings,
          canActivate: result.canActivate,
          error: result.syncFailed
            ? "Checklist updated locally but backend sync failed. Activation may fail until sync succeeds."
            : null,
        }));
      } catch {
        if (!active) {
          return;
        }
        setState((previous) => ({
          ...previous,
          loading: false,
          error: "Could not load onboarding checklist from workspace data.",
        }));
      }
    };

    void loadInitial();

    return () => {
      active = false;
    };
  }, [evaluateOnboarding]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onFocus = () => {
      void refreshOnboarding({ withLoading: false });
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshOnboarding]);

  const onActivate = useCallback(async () => {
    const workspaceId = getSessionState().workspaceId;
    setState((previous) => ({
      ...previous,
      activating: true,
      error: null,
      activationMessage: null,
    }));

    const refreshedSteps = await refreshOnboarding({ withLoading: false, clearMessage: true });
    const stepsForActivation = refreshedSteps ?? state.steps;
    const allCompleted = stepsForActivation.every((step) => step.completed);

    if (!allCompleted) {
      setState((previous) => ({
        ...previous,
        activating: false,
        error: "Complete all onboarding steps before activation.",
        activeStepIndex: findFirstIncompleteIndex(stepsForActivation),
      }));
      return;
    }

    if (!workspaceId) {
      setState((previous) => ({
        ...previous,
        activating: false,
        activationMessage: "Workspace marked as active locally.",
      }));
      return;
    }

    try {
      await activateWorkspace(workspaceId);
      setState((previous) => ({
        ...previous,
        activating: false,
        workspaceStatus: "active",
        canActivate: true,
        activeStepIndex: Math.max(previous.steps.length - 1, 0),
        activationMessage: "Workspace activated successfully.",
      }));
      router.replace(dashboardPath);
    } catch {
      setState((previous) => ({
        ...previous,
        activating: false,
        error: "Activation failed. Verify required backend setup and owner permissions.",
      }));
    }
  }, [dashboardPath, refreshOnboarding, router, state.steps]);

  const onGoToDashboard = useCallback(() => {
    router.replace(dashboardPath);
  }, [dashboardPath, router]);

  const onSelectStep = useCallback((index: number) => {
    setState((previous) => {
      if (!previous.steps.length) {
        return previous;
      }
      const bounded = Math.min(Math.max(index, 0), previous.steps.length - 1);
      return {
        ...previous,
        activeStepIndex: bounded,
      };
    });
  }, []);

  const onNextStep = useCallback(() => {
    void (async () => {
      const selectedStepIndex = state.activeStepIndex;
      const refreshedSteps = await refreshOnboarding({ withLoading: false });
      const latestSteps = refreshedSteps ?? state.steps;
      const boundedCurrentIndex = Math.min(
        Math.max(selectedStepIndex, 0),
        Math.max(latestSteps.length - 1, 0),
      );
      const currentStep = latestSteps[boundedCurrentIndex];

      if (currentStep?.key === "channels" && !currentStep.completed) {
        setState((previous) => ({
          ...previous,
          error:
            "Complete both Gmail and Google Calendar integrations before moving to the next step.",
        }));
        return;
      }

      const shouldMarkContactFormCompleted = currentStep?.key === "contact_form";
      if (shouldMarkContactFormCompleted) {
        const workspaceId = getSessionState().workspaceId;
        if (workspaceId) {
          writeContactFormAck(workspaceId);
        }
        setContactFormAcknowledged(true);
      }

      setState((previous) => {
        const nextSteps = shouldMarkContactFormCompleted
          ? latestSteps.map((step) =>
              step.key === "contact_form" ? { ...step, completed: true } : step,
            )
          : latestSteps;
        const nextStepIndex = Math.min(
          boundedCurrentIndex + 1,
          Math.max(nextSteps.length - 1, 0),
        );

        return {
          ...previous,
          steps: nextSteps,
          error: null,
          activeStepIndex: nextStepIndex,
        };
      });
    })();
  }, [refreshOnboarding, state.activeStepIndex, state.steps]);

  const onPreviousStep = useCallback(() => {
    setState((previous) => ({
      ...previous,
      activeStepIndex: Math.max(previous.activeStepIndex - 1, 0),
    }));
  }, []);

  const onRefresh = useCallback(async () => {
    await refreshOnboarding({ withLoading: true });
  }, [refreshOnboarding]);

  const completion = useMemo(() => {
    const completed = state.steps.filter((step) => step.completed).length;
    return state.steps.length ? Math.round((completed / state.steps.length) * 100) : 0;
  }, [state.steps]);

  return {
    ...state,
    completion,
    onActivate,
    onGoToDashboard,
    onRefresh,
    onSelectStep,
    onNextStep,
    onPreviousStep,
  };
}
