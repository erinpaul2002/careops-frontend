import type { PublicFormPayload, UploadedFormFile } from "@/lib/api/types";

interface PublicFormProps {
  token: string;
}

interface PublicFormState {
  loading: boolean;
  submitting: boolean;
  uploadingFieldKey: string | null;
  error: string | null;
  successMessage: string | null;
  payload: PublicFormPayload | null;
  values: Record<string, string | boolean | UploadedFormFile>;
}

export interface PublicFormUIProps extends PublicFormProps, PublicFormState {
  onChange: (key: string, value: string | boolean) => void;
  onFileChange: (key: string, file: File | null) => Promise<void>;
  onSubmit: () => Promise<void>;
}

export type { PublicFormProps, PublicFormState };
