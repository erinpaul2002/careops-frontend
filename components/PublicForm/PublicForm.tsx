"use client";

import PublicFormUI from "@/components/PublicForm/PublicFormUI";
import { usePublicForm } from "@/components/PublicForm/usePublicForm";
import type { PublicFormProps } from "@/components/PublicForm/types";

export default function PublicForm({ token }: PublicFormProps) {
  const {
    loading,
    submitting,
    uploadingFieldKey,
    error,
    successMessage,
    payload,
    values,
    onChange,
    onFileChange,
    onSubmit,
  } = usePublicForm({ token });

  return (
    <PublicFormUI
      token={token}
      loading={loading}
      submitting={submitting}
      uploadingFieldKey={uploadingFieldKey}
      error={error}
      successMessage={successMessage}
      payload={payload}
      values={values}
      onChange={onChange}
      onFileChange={onFileChange}
      onSubmit={onSubmit}
    />
  );
}
