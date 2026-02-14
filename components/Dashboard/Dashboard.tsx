"use client";

import DashboardUI from "@/components/Dashboard/DashboardUI";
import { useDashboard } from "@/components/Dashboard/useDashboard";

export default function Dashboard() {
  const {
    loading,
    error,
    summary,
    metrics,
    refresh,
    clearAlerts,
    restoreAlerts,
    hasDismissedAlerts,
  } = useDashboard();

  return (
    <DashboardUI
      loading={loading}
      error={error}
      summary={summary}
      metrics={metrics}
      onRefresh={refresh}
      onClearAlerts={clearAlerts}
      onRestoreAlerts={restoreAlerts}
      hasDismissedAlerts={hasDismissedAlerts}
    />
  );
}
