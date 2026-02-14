"use client";

import FormsWorkspaceUI from "@/components/FormsWorkspace/FormsWorkspaceUI";
import { useFormsWorkspace } from "@/components/FormsWorkspace/useFormsWorkspace";

export default function FormsWorkspace() {
  const { loading, error, statusFilter, requests, onStatusFilterChange, onRefresh } =
    useFormsWorkspace();

  return (
    <FormsWorkspaceUI
      loading={loading}
      error={error}
      statusFilter={statusFilter}
      requests={requests}
      onStatusFilterChange={onStatusFilterChange}
      onRefresh={onRefresh}
    />
  );
}
