import type { DashboardMetrics, DashboardSummary } from "@/lib/api/types";

export interface DashboardState {
  loading: boolean;
  error: string | null;
  summary: DashboardSummary;
  metrics: DashboardMetrics;
}

export interface DashboardUIProps extends DashboardState {
  onRefresh: () => Promise<void>;
  onClearAlerts: () => void;
  onRestoreAlerts: () => void;
  hasDismissedAlerts: boolean;
}
