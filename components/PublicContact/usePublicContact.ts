"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicFlowConfig, submitPublicContact } from "@/lib/api/client";
import type { PublicFlowConfig } from "@/lib/api/types";
import type { PublicContactProps, PublicContactState } from "@/components/PublicContact/types";

const defaultPublicFlowConfig: PublicFlowConfig = {
  booking: { fields: [] },
  contact: { fields: [] },
};

const initialState: PublicContactState = {
  fieldValues: {},
  publicFlowConfig: defaultPublicFlowConfig,
  loading: false,
  error: null,
  successMessage: null,
};

export function usePublicContact({ workspaceId }: PublicContactProps) {
  const [state, setState] = useState<PublicContactState>(initialState);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const publicFlowConfig = await getPublicFlowConfig(workspaceId);
        setState((previous) => ({ ...previous, publicFlowConfig }));
      } catch {
        setState((previous) => ({ ...previous, error: "Unable to load contact form settings." }));
      }
    };

    void loadConfig();
  }, [workspaceId]);

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
    const configuredFields = state.publicFlowConfig.contact.fields;
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
      await submitPublicContact(workspaceId, {
        fields: submission,
      });

      setState((previous) => ({
        ...previous,
        loading: false,
        fieldValues: {},
        successMessage: "Thanks. Your message was sent successfully.",
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: "Could not submit contact request right now.",
      }));
    }
  }, [state.fieldValues, state.publicFlowConfig.contact.fields, workspaceId]);

  return {
    ...state,
    onFieldChange,
    onSubmit,
  };
}

