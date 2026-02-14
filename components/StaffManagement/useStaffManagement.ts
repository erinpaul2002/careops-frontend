"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createWorkspaceMember,
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/lib/api/client";
import { getSessionState } from "@/lib/session";
import type { WorkspaceMember } from "@/lib/api/types";
import type {
  StaffDraft,
  StaffManagementState,
} from "@/components/StaffManagement/types";

const initialDraft: StaffDraft = {
  name: "",
  email: "",
  password: "",
};

const initialState: StaffManagementState = {
  loading: true,
  error: null,
  success: null,
  workspaceId: null,
  members: [],
  draft: initialDraft,
  creating: false,
  mutatingMemberId: null,
};

export function useStaffManagement() {
  const [state, setState] = useState<StaffManagementState>(initialState);

  const refresh = useCallback(async () => {
    const workspaceId = getSessionState().workspaceId ?? null;
    if (!workspaceId) {
      setState((previous) => ({
        ...previous,
        workspaceId: null,
        loading: false,
        error: "No workspace found in session.",
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      workspaceId,
      loading: true,
      error: null,
      success: null,
    }));

    try {
      const members = await getWorkspaceMembers(workspaceId);
      setState((previous) => ({
        ...previous,
        loading: false,
        workspaceId,
        members,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        workspaceId,
        error: "Could not load workspace members.",
      }));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const onDraftChange = useCallback((field: keyof StaffDraft, value: string) => {
    setState((previous) => ({
      ...previous,
      draft: {
        ...previous.draft,
        [field]: value,
      },
      error: null,
      success: null,
    }));
  }, []);

  const onCreateStaff = useCallback(async () => {
    if (!state.workspaceId) {
      setState((previous) => ({ ...previous, error: "Workspace context missing." }));
      return;
    }

    const name = state.draft.name.trim();
    const email = state.draft.email.trim().toLowerCase();
    const password = state.draft.password;

    if (!name || !email || !password) {
      setState((previous) => ({
        ...previous,
        error: "Name, email, and password are required.",
      }));
      return;
    }

    setState((previous) => ({ ...previous, creating: true, error: null, success: null }));

    try {
      await createWorkspaceMember(state.workspaceId, {
        name,
        email,
        password,
        role: "staff",
      });

      const members = await getWorkspaceMembers(state.workspaceId);
      setState((previous) => ({
        ...previous,
        creating: false,
        members,
        draft: initialDraft,
        success: "Staff account created.",
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        creating: false,
        error: "Failed to create staff account. Check email uniqueness and password format.",
      }));
    }
  }, [state.draft.email, state.draft.name, state.draft.password, state.workspaceId]);

  const onToggleRole = useCallback(async (member: WorkspaceMember) => {
    if (!state.workspaceId) {
      return;
    }

    const nextRole = member.role === "staff" ? "owner" : "staff";
    setState((previous) => ({ ...previous, mutatingMemberId: member.id, error: null, success: null }));

    try {
      await updateWorkspaceMemberRole(state.workspaceId, member.userId, nextRole);
      const members = await getWorkspaceMembers(state.workspaceId);
      setState((previous) => ({
        ...previous,
        mutatingMemberId: null,
        members,
        success: `Updated role to ${nextRole}.`,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        mutatingMemberId: null,
        error: "Could not update member role.",
      }));
    }
  }, [state.workspaceId]);

  const onRemoveMember = useCallback(async (member: WorkspaceMember) => {
    if (!state.workspaceId) {
      return;
    }

    setState((previous) => ({ ...previous, mutatingMemberId: member.id, error: null, success: null }));

    try {
      await removeWorkspaceMember(state.workspaceId, member.userId);
      const members = await getWorkspaceMembers(state.workspaceId);
      setState((previous) => ({
        ...previous,
        mutatingMemberId: null,
        members,
        success: "Member removed.",
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        mutatingMemberId: null,
        error: "Could not remove member.",
      }));
    }
  }, [state.workspaceId]);

  return {
    ...state,
    onDraftChange,
    onCreateStaff,
    onToggleRole,
    onRemoveMember,
    onRefresh: refresh,
  };
}
