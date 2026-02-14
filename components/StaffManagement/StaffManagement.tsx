"use client";

import StaffManagementUI from "@/components/StaffManagement/StaffManagementUI";
import { useStaffManagement } from "@/components/StaffManagement/useStaffManagement";

export default function StaffManagement() {
  const {
    loading,
    error,
    success,
    workspaceId,
    members,
    draft,
    creating,
    mutatingMemberId,
    onDraftChange,
    onCreateStaff,
    onToggleRole,
    onRemoveMember,
    onRefresh,
  } = useStaffManagement();

  return (
    <StaffManagementUI
      loading={loading}
      error={error}
      success={success}
      workspaceId={workspaceId}
      members={members}
      draft={draft}
      creating={creating}
      mutatingMemberId={mutatingMemberId}
      onDraftChange={onDraftChange}
      onCreateStaff={onCreateStaff}
      onToggleRole={onToggleRole}
      onRemoveMember={onRemoveMember}
      onRefresh={onRefresh}
    />
  );
}
