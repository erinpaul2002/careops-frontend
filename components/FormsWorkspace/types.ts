import type { FormRequest } from "@/lib/api/types";

export interface FormsWorkspaceState {
  loading: boolean;
  error: string | null;
  statusFilter: "all" | "pending" | "completed" | "overdue";
  requests: FormRequest[];
}

export interface FormsWorkspaceUIProps extends FormsWorkspaceState {
  onStatusFilterChange: (
    status: "all" | "pending" | "completed" | "overdue",
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
}
