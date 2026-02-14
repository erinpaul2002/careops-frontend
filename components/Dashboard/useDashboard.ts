"use client";

import { useCallback, useEffect, useState } from "react";
import { getDashboardMetrics, getDashboardSummary } from "@/lib/api/client";
import type { DashboardState } from "@/components/Dashboard/types";
import { getSessionState } from "@/lib/session";

const emptySummary: DashboardState["summary"] = {
  date: "",
  bookingsToday: 0,
  newLeadsToday: 0,
  unansweredConversations: 0,
  pendingForms: 0,
  lowStockItems: 0,
  alerts: [],
};

const emptyMetrics: DashboardState["metrics"] = {
  period: "30d",
  generatedAt: "",
  metrics: {
    leads: 0,
    bookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    bookingConversionRatePct: 0,
    completionRatePct: 0,
  },
};

const fallbackState: DashboardState = {
  loading: true,
  error: null,
  summary: emptySummary,
  metrics: emptyMetrics,
};

const DISMISSED_ALERTS_STORAGE_PREFIX = "careops.dashboard.dismissedAlerts";

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(fallbackState);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const getDismissedAlertsStorageKey = useCallback(() => {
    const workspaceId = getSessionState().workspaceId?.trim() ?? "default";
    return `${DISMISSED_ALERTS_STORAGE_PREFIX}.${workspaceId}`;
  }, []);

  const readDismissedAlertIds = useCallback((): string[] => {
    if (typeof window === "undefined") {
      return [];
    }
    const raw = window.localStorage.getItem(getDismissedAlertsStorageKey());
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((value): value is string => typeof value === "string");
    } catch {
      return [];
    }
  }, [getDismissedAlertsStorageKey]);

  const writeDismissedAlertIds = useCallback((ids: string[]) => {
    if (typeof window === "undefined") {
      return;
    }
    const key = getDismissedAlertsStorageKey();
    if (!ids.length) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(ids));
  }, [getDismissedAlertsStorageKey]);

  const refresh = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState((previous) => ({ ...previous, loading: true, error: null }));
    }

    try {
      const [summary, metrics] = await Promise.all([
        getDashboardSummary(),
        getDashboardMetrics("30d"),
      ]);
      const dismissed = new Set(readDismissedAlertIds());
      const filteredSummary = dismissed.size
        ? { ...summary, alerts: summary.alerts.filter((alert) => !dismissed.has(alert.id)) }
        : summary;
      setState({ loading: false, error: null, summary: filteredSummary, metrics });
    } catch {
      setState({
        loading: false,
        error: "Unable to load dashboard data.",
        summary: emptySummary,
        metrics: emptyMetrics,
      });
    }
  }, [readDismissedAlertIds]);

  useEffect(() => {
    const dismissed = readDismissedAlertIds();
    const syncDismissed = window.setTimeout(() => {
      setDismissedAlertIds(dismissed);
    }, 0);
    const kickoff = window.setTimeout(() => {
      void refresh(false);
    }, 0);
    const timer = window.setInterval(() => {
      void refresh();
    }, 45_000);
    return () => {
      window.clearTimeout(syncDismissed);
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [readDismissedAlertIds, refresh]);

  const clearAlerts = useCallback(() => {
    const visibleAlertIds = state.summary.alerts.map((alert) => alert.id);
    if (!visibleAlertIds.length) {
      return;
    }
    const nextDismissed = Array.from(new Set([...dismissedAlertIds, ...visibleAlertIds]));
    setDismissedAlertIds(nextDismissed);
    writeDismissedAlertIds(nextDismissed);
    setState((previous) => ({
      ...previous,
      summary: {
        ...previous.summary,
        alerts: [],
      },
    }));
  }, [dismissedAlertIds, state.summary.alerts, writeDismissedAlertIds]);

  const restoreAlerts = useCallback(() => {
    setDismissedAlertIds([]);
    writeDismissedAlertIds([]);
    void refresh(false);
  }, [refresh, writeDismissedAlertIds]);

  return {
    ...state,
    refresh,
    clearAlerts,
    restoreAlerts,
    hasDismissedAlerts: dismissedAlertIds.length > 0,
  };
}
