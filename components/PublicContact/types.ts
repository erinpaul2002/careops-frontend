import type { PublicFlowConfig } from "@/lib/api/types";

interface PublicContactProps {
  workspaceId: string;
}

interface PublicContactState {
  fieldValues: Record<string, string | boolean>;
  publicFlowConfig: PublicFlowConfig;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

export interface PublicContactUIProps extends PublicContactProps, PublicContactState {
  onFieldChange: (key: string, value: string | boolean) => void;
  onSubmit: () => Promise<void>;
}

export type { PublicContactProps, PublicContactState };
