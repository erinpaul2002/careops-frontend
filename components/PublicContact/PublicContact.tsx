"use client";

import PublicContactUI from "@/components/PublicContact/PublicContactUI";
import { usePublicContact } from "@/components/PublicContact/usePublicContact";
import type { PublicContactProps } from "@/components/PublicContact/types";

export default function PublicContact({ workspaceId }: PublicContactProps) {
  const {
    fieldValues,
    publicFlowConfig,
    loading,
    error,
    successMessage,
    onFieldChange,
    onSubmit,
  } = usePublicContact({ workspaceId });

  return (
    <PublicContactUI
      workspaceId={workspaceId}
      fieldValues={fieldValues}
      publicFlowConfig={publicFlowConfig}
      loading={loading}
      error={error}
      successMessage={successMessage}
      onFieldChange={onFieldChange}
      onSubmit={onSubmit}
    />
  );
}

