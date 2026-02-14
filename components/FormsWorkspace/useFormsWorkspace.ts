"use client";

import { useCallback, useEffect, useState } from "react";
import { getFormRequests } from "@/lib/api/client";
import type { FormsWorkspaceState } from "@/components/FormsWorkspace/types";

const initialState: FormsWorkspaceState = {
  loading: true,
  error: null,
  statusFilter: "all",
  requests: [],
};

export function useFormsWorkspace() {
  const [state, setState] = useState<FormsWorkspaceState>(initialState);

  const load = useCallback(
    async (
      statusFilter: "all" | "pending" | "completed" | "overdue",
      showLoading = true,
    ) => {
      if (showLoading) {
        setState((previous) => ({ ...previous, loading: true, error: null, statusFilter }));
      }

      try {
        const requests = await getFormRequests(statusFilter === "all" ? undefined : statusFilter);
        setState((previous) => ({ ...previous, loading: false, requests, error: null }));
      } catch {
        setState((previous) => ({
          ...previous,
          loading: false,
          requests: [],
          error: "Unable to load form requests.",
        }));
      }
    },
    [],
  );

  useEffect(() => {
    const kickoff = window.setTimeout(() => {
      void load("all", false);
    }, 0);
    return () => window.clearTimeout(kickoff);
  }, [load]);

  return {
    ...state,
    onStatusFilterChange: load,
    onRefresh: () => load(state.statusFilter),
  };
}
