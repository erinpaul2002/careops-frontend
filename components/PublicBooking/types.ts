import type { PublicFlowConfig, Service, Slot } from "@/lib/api/types";

interface PublicBookingProps {
  workspaceId: string;
}

interface PublicBookingState {
  services: Service[];
  selectedServiceId: string;
  date: string;
  slotTimezone: string;
  slots: Slot[];
  selectedStartsAt: string;
  fieldValues: Record<string, string | boolean>;
  publicFlowConfig: PublicFlowConfig;
  loading: boolean;
  slotLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

type PublicBookingMetaField =
  | "selectedServiceId"
  | "date"
  | "selectedStartsAt";

export interface PublicBookingUIProps extends PublicBookingProps, PublicBookingState {
  onMetaChange: (field: PublicBookingMetaField, value: string) => Promise<void>;
  onFieldChange: (key: string, value: string | boolean) => void;
  onSubmit: () => Promise<void>;
}

export type { PublicBookingMetaField, PublicBookingProps, PublicBookingState };
