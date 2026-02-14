export interface OnboardingStep {
  key:
    | "workspace"
    | "channels"
    | "contact_form"
    | "bookings"
    | "forms"
    | "inventory"
    | "staff"
    | "activation_review";
  label: string;
  detail: string;
  completed: boolean;
}

export interface OnboardingState {
  loading: boolean;
  error: string | null;
  steps: OnboardingStep[];
  activeStepIndex: number;
  blockers: string[];
  warnings: string[];
  canActivate: boolean;
  activating: boolean;
  workspaceStatus: "draft" | "active";
  activationMessage: string | null;
}

export interface OnboardingUIProps extends OnboardingState {
  completion: number;
  onActivate: () => Promise<void>;
  onGoToDashboard: () => void;
  onRefresh: () => Promise<void>;
  onSelectStep: (index: number) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
}
