import type { WorkspaceMember } from "@/lib/api/types";

export interface StaffDraft {
  name: string;
  email: string;
  password: string;
}

export interface StaffManagementState {
  loading: boolean;
  error: string | null;
  success: string | null;
  workspaceId: string | null;
  members: WorkspaceMember[];
  draft: StaffDraft;
  creating: boolean;
  mutatingMemberId: string | null;
}

export interface StaffManagementUIProps extends StaffManagementState {
  onDraftChange: (field: keyof StaffDraft, value: string) => void;
  onCreateStaff: () => Promise<void>;
  onToggleRole: (member: WorkspaceMember) => Promise<void>;
  onRemoveMember: (member: WorkspaceMember) => Promise<void>;
  onRefresh: () => Promise<void>;
}
