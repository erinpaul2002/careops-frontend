"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CalendarClock, RefreshCw, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DashboardUIProps } from "@/components/Dashboard/types";
import { formatDateTime, formatPercent } from "@/lib/format";

const cardMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28 },
};

function toneFromSeverity(severity: "info" | "warning" | "critical"): "success" | "warning" | "danger" | "neutral" {
  if (severity === "critical") {
    return "danger";
  }
  if (severity === "warning") {
    return "warning";
  }
  return "neutral";
}

/* Strata depth colors for metric tiles */
const metricAccents = ["#00AA6C", "#2563EB", "#F59E0B", "#EF4444", "#EF4444"];

export default function DashboardUI({
  loading,
  error,
  summary,
  metrics,
  onRefresh,
  onClearAlerts,
  onRestoreAlerts,
  hasDismissedAlerts,
}: DashboardUIProps) {
  return (
    <div className="space-y-6">
      {/* ─── Section Header ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Live Overview — Surface Readings</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>Today at a Glance</h2>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all duration-200"
          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F4F6F8"; e.currentTarget.style.borderColor = "#00AA6C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#00AA6C" }} />
          Refresh
        </button>
      </div>

      {/* Fault line divider */}
      <div className="fault-line" />

      {error ? (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}>{error}</div>
      ) : null}

      {/* ─── Metric Tiles: Core Sample Readings ─── */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Bookings Today", value: summary.bookingsToday },
          { label: "New Leads", value: summary.newLeadsToday },
          { label: "Unanswered", value: summary.unansweredConversations },
          { label: "Pending Forms", value: summary.pendingForms },
          { label: "Low Stock", value: summary.lowStockItems },
        ].map((item, index) => (
          <motion.article
            key={item.label}
            className="metric-tile p-4"
            style={{ "--metric-accent": metricAccents[index] } as React.CSSProperties}
            {...cardMotion}
            transition={{ delay: index * 0.05 }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md" style={{ background: metricAccents[index] }} />
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>{item.label}</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: metricAccents[index] }}>{item.value}</p>
          </motion.article>
        ))}
      </section>

      {/* ─── Performance & Snapshot: Sediment Analysis ─── */}
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <article className="panel p-5">
          <header className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: "#00AA6C12", border: "1px solid #00AA6C25" }}>
              <TrendingUp size={14} style={{ color: "#00AA6C" }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>30-Day Performance</h3>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
              <p className="text-[0.65rem] uppercase tracking-wider" style={{ color: "#5A6A7A" }}>Lead to Booking</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "#00AA6C" }}>{formatPercent(metrics.metrics.bookingConversionRatePct)}</p>
            </div>
            <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
              <p className="text-[0.65rem] uppercase tracking-wider" style={{ color: "#5A6A7A" }}>Completion Rate</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "#2563EB" }}>{formatPercent(metrics.metrics.completionRatePct)}</p>
            </div>
            <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
              <p className="text-[0.65rem] uppercase tracking-wider" style={{ color: "#5A6A7A" }}>Confirmed</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "#1A1A1A" }}>{metrics.metrics.confirmedBookings}</p>
            </div>
            <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
              <p className="text-[0.65rem] uppercase tracking-wider" style={{ color: "#5A6A7A" }}>No Shows</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "#EF4444" }}>{metrics.metrics.noShowBookings}</p>
            </div>
          </div>
        </article>

        <article className="panel p-5">
          <header className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: "#2563EB12", border: "1px solid #2563EB25" }}>
              <CalendarClock size={14} style={{ color: "#2563EB" }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Snapshot</h3>
          </header>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <dt style={{ color: "#5A6A7A" }}>Leads</dt>
              <dd className="font-medium" style={{ color: "#1A1A1A" }}>{metrics.metrics.leads}</dd>
            </div>
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <dt style={{ color: "#5A6A7A" }}>Bookings</dt>
              <dd className="font-medium" style={{ color: "#1A1A1A" }}>{metrics.metrics.bookings}</dd>
            </div>
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <dt style={{ color: "#5A6A7A" }}>Completed</dt>
              <dd className="font-medium" style={{ color: "#00AA6C" }}>{metrics.metrics.completedBookings}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt style={{ color: "#5A6A7A" }}>Updated</dt>
              <dd style={{ color: "#1A1A1A" }}>{formatDateTime(metrics.generatedAt)}</dd>
            </div>
          </dl>
        </article>
      </section>

      {/* ─── Operational Alerts: Seismic Warnings ─── */}
      <section className="panel p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: "#F59E0B12", border: "1px solid #F59E0B25" }}>
              <AlertTriangle size={14} style={{ color: "#F59E0B" }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Operational Alerts</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasDismissedAlerts ? (
              <button
                type="button"
                onClick={onRestoreAlerts}
                className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
              >
                Show cleared
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClearAlerts}
              disabled={!summary.alerts.length}
              className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
            >
              Clear alerts
            </button>
          </div>
        </header>

        <div className="space-y-2">
          {summary.alerts.length ? (
            summary.alerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
                <div className="space-y-1">
                  <p style={{ color: "#1A1A1A" }}>{alert.message}</p>
                  <p className="text-xs" style={{ color: "#5A6A7A" }}>{formatDateTime(alert.createdAt)}</p>
                </div>
                <StatusBadge tone={toneFromSeverity(alert.severity)} label={alert.severity} />
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: "#5A6A7A" }}>No alerts.</p>
          )}
        </div>
      </section>
    </div>
  );
}
