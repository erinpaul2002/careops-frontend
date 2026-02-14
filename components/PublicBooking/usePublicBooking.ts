"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPublicBooking,
  getPublicFlowConfig,
  getPublicServices,
  getPublicSlots,
} from "@/lib/api/client";
import type { PublicFlowConfig } from "@/lib/api/types";
import type {
  PublicBookingMetaField,
  PublicBookingProps,
  PublicBookingState,
} from "@/components/PublicBooking/types";

const defaultPublicFlowConfig: PublicFlowConfig = {
  booking: { fields: [] },
  contact: { fields: [] },
};

function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialState: PublicBookingState = {
  services: [],
  selectedServiceId: "",
  date: getLocalDateKey(),
  slotTimezone: "UTC",
  slots: [],
  selectedStartsAt: "",
  fieldValues: {},
  publicFlowConfig: defaultPublicFlowConfig,
  loading: false,
  slotLoading: false,
  error: null,
  successMessage: null,
};

export function usePublicBooking({ workspaceId }: PublicBookingProps) {
  const [state, setState] = useState<PublicBookingState>(initialState);

  const loadSlots = useCallback(
    async (serviceId: string, date: string) => {
      if (!serviceId || !date) {
        return;
      }
      setState((previous) => ({ ...previous, slotLoading: true }));

      try {
        const payload = await getPublicSlots(workspaceId, serviceId, date);
        const slots = payload.slots;
        setState((previous) => ({
          ...previous,
          slotLoading: false,
          slotTimezone: payload.timezone || previous.slotTimezone,
          slots,
          selectedStartsAt: slots[0]?.startsAt ?? "",
          error: null,
        }));
      } catch {
        setState((previous) => ({
          ...previous,
          slotLoading: false,
          slots: [],
          selectedStartsAt: "",
          error: "Unable to load available slots.",
        }));
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    const loadServices = async () => {
      try {
        const [services, publicFlowConfig] = await Promise.all([
          getPublicServices(workspaceId),
          getPublicFlowConfig(workspaceId),
        ]);

        const firstService = services[0];
        setState((previous) => ({
          ...previous,
          services,
          publicFlowConfig,
          selectedServiceId: firstService?.id ?? "",
          error: null,
        }));

        if (firstService) {
          const currentDate = getLocalDateKey();
          setState((previous) => ({ ...previous, date: currentDate }));
          await loadSlots(firstService.id, currentDate);
        }
      } catch {
        setState((previous) => ({
          ...previous,
          services: [],
          selectedServiceId: "",
          slots: [],
          selectedStartsAt: "",
          error: "Unable to load booking options.",
        }));
      }
    };

    void loadServices();
  }, [loadSlots, workspaceId]);

  const onMetaChange = useCallback(
    async (field: PublicBookingMetaField, value: string) => {
      setState((previous) => ({ ...previous, [field]: value, error: null, successMessage: null }));

      if (field === "selectedServiceId") {
        await loadSlots(value, state.date);
      }
      if (field === "date") {
        await loadSlots(state.selectedServiceId, value);
      }
    },
    [loadSlots, state.date, state.selectedServiceId],
  );

  const onFieldChange = useCallback((key: string, value: string | boolean) => {
    setState((previous) => ({
      ...previous,
      fieldValues: {
        ...previous.fieldValues,
        [key]: value,
      },
      error: null,
      successMessage: null,
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!state.selectedServiceId || !state.selectedStartsAt) {
      setState((previous) => ({
        ...previous,
        error: "Select a service and slot before submitting.",
      }));
      return;
    }

    const configuredFields = state.publicFlowConfig.booking.fields;
    const submission: Record<string, unknown> = {};

    configuredFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(state.fieldValues, field.key)) {
        submission[field.key] = state.fieldValues[field.key];
      }
    });

    const missingRequired = configuredFields.find((field) => {
      if (!field.required) {
        return false;
      }
      const value = submission[field.key];
      if (typeof value === "boolean") {
        return !value;
      }
      if (typeof value === "string") {
        return value.trim().length === 0;
      }
      return value === undefined || value === null;
    });

    if (missingRequired) {
      setState((previous) => ({
        ...previous,
        error: `${missingRequired.label} is required.`,
      }));
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null, successMessage: null }));

    try {
      const result = await createPublicBooking(workspaceId, {
        serviceId: state.selectedServiceId,
        startsAt: state.selectedStartsAt,
        fields: submission,
      });

      const tokenHint = result.formRequest?.publicToken
        ? ` Form token: ${result.formRequest.publicToken}`
        : "";

      setState((previous) => ({
        ...previous,
        loading: false,
        fieldValues: {},
        successMessage: `Booking submitted successfully.${tokenHint}`,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: "Could not submit booking right now.",
      }));
    }
  }, [
    state.fieldValues,
    state.publicFlowConfig.booking.fields,
    state.selectedServiceId,
    state.selectedStartsAt,
    workspaceId,
  ]);

  return {
    ...state,
    onMetaChange,
    onFieldChange,
    onSubmit,
  };
}
