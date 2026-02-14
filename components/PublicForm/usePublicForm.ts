"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPublicFormFileUploadUrl,
  getPublicForm,
  submitPublicForm,
  uploadFileToSignedUrl,
} from "@/lib/api/client";
import type { UploadedFormFile } from "@/lib/api/types";
import type { PublicFormProps, PublicFormState } from "@/components/PublicForm/types";

const initialState: PublicFormState = {
  loading: true,
  submitting: false,
  uploadingFieldKey: null,
  error: null,
  successMessage: null,
  payload: null,
  values: {},
};

function fieldKey(field: {
  key?: string;
  name?: string;
  label?: string;
}): string {
  return field.key ?? field.name ?? field.label?.toLowerCase().replace(/\s+/g, "_") ?? "field";
}

function isUploadedFile(value: unknown): value is UploadedFormFile {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as UploadedFormFile).key === "string" &&
    typeof (value as UploadedFormFile).fileName === "string" &&
    typeof (value as UploadedFormFile).contentType === "string" &&
    typeof (value as UploadedFormFile).size === "number"
  );
}

export function usePublicForm({ token }: PublicFormProps) {
  const [state, setState] = useState<PublicFormState>(initialState);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await getPublicForm(token);
        setState((previous) => ({ ...previous, loading: false, payload, error: null }));
      } catch {
        setState((previous) => ({
          ...previous,
          loading: false,
          payload: null,
          error: "Unable to load form request.",
        }));
      }
    };

    void load();
  }, [token]);

  const onChange = useCallback((key: string, value: string | boolean) => {
    setState((previous) => ({
      ...previous,
      values: {
        ...previous.values,
        [key]: value,
      },
      error: null,
      successMessage: null,
    }));
  }, []);

  const onFileChange = useCallback(
    async (key: string, file: File | null) => {
      if (!file) {
        setState((previous) => {
          const values = { ...previous.values };
          delete values[key];
          return {
            ...previous,
            values,
            error: null,
            successMessage: null,
          };
        });
        return;
      }

      const contentType = file.type.trim().toLowerCase();
      if (!contentType) {
        setState((previous) => ({
          ...previous,
          error: "Selected file type is not supported.",
          successMessage: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        uploadingFieldKey: key,
        error: null,
        successMessage: null,
      }));

      try {
        const uploadData = await createPublicFormFileUploadUrl(token, {
          fieldKey: key,
          fileName: file.name,
          contentType,
          size: file.size,
        });

        if (file.size > uploadData.maxSizeBytes) {
          throw new Error(`File exceeds maximum upload size of ${uploadData.maxSizeBytes} bytes`);
        }
        if (
          uploadData.allowedContentTypes.length > 0 &&
          !uploadData.allowedContentTypes.includes(contentType)
        ) {
          throw new Error("Selected file type is not allowed");
        }

        await uploadFileToSignedUrl(uploadData.uploadUrl, file, contentType);

        const uploaded: UploadedFormFile = {
          key: uploadData.key,
          fileName: file.name,
          contentType,
          size: file.size,
        };

        setState((previous) => ({
          ...previous,
          uploadingFieldKey: null,
          values: {
            ...previous.values,
            [key]: uploaded,
          },
          error: null,
          successMessage: null,
        }));
      } catch {
        setState((previous) => ({
          ...previous,
          uploadingFieldKey: null,
          error: "Could not upload file right now.",
          successMessage: null,
        }));
      }
    },
    [token],
  );

  const onSubmit = useCallback(async () => {
    if (!state.payload) {
      return;
    }
    if (state.uploadingFieldKey) {
      setState((previous) => ({
        ...previous,
        error: "Please wait for file upload to finish before submitting.",
      }));
      return;
    }

    const submissionPayload = state.payload.template.fields.reduce<
      Record<string, string | boolean | UploadedFormFile>
    >((accumulator, field) => {
      const key = fieldKey(field);
      if (key in state.values) {
        const value = state.values[key];
        if (typeof value === "string" || typeof value === "boolean" || isUploadedFile(value)) {
          accumulator[key] = value;
        }
      }
      return accumulator;
    }, {});

    const requiredMissing = state.payload.template.fields.some((field) => {
      if (!field.required) {
        return false;
      }
      const key = fieldKey(field);
      const value = submissionPayload[key];
      const type = (field.type ?? "text").toLowerCase();
      if (type === "file") {
        return !isUploadedFile(value);
      }
      if (typeof value === "boolean") {
        return !value;
      }
      return typeof value !== "string" || value.trim().length === 0;
    });

    if (requiredMissing) {
      setState((previous) => ({
        ...previous,
        error: "Fill all required fields before submitting.",
      }));
      return;
    }

    setState((previous) => ({ ...previous, submitting: true, error: null, successMessage: null }));

    try {
      await submitPublicForm(token, submissionPayload);
      setState((previous) => ({
        ...previous,
        submitting: false,
        successMessage: "Form submitted successfully.",
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        submitting: false,
        error: "Could not submit form right now.",
      }));
    }
  }, [state.payload, state.uploadingFieldKey, state.values, token]);

  return {
    ...state,
    onChange,
    onFileChange,
    onSubmit,
  };
}

export { fieldKey, isUploadedFile };
