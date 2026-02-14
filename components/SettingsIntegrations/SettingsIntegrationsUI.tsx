"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Link2,
  Mail,
  Plug,
  RefreshCw,
  Sparkles,
  Unplug,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SettingsIntegrationsUIProps } from "@/components/SettingsIntegrations/types";
import { formatDateTime } from "@/lib/format";

/* ── animation orchestration ── */
const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function toneFromStatus(status: "connected" | "error" | "disconnected") {
  if (status === "connected") return "success" as const;
  if (status === "error") return "danger" as const;
  return "neutral" as const;
}

const providerMeta: Record<string, { icon: typeof Mail; color: string; bg: string; label: string }> = {
  gmail: { icon: Mail, color: "#EA4335", bg: "#EA433510", label: "Gmail" },
  "google-calendar": { icon: Calendar, color: "#4285F4", bg: "#4285F410", label: "Google Calendar" },
  google_calendar: { icon: Calendar, color: "#4285F4", bg: "#4285F410", label: "Google Calendar" },
};

/* ── Animated toggle switch ── */
function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: checked ? "#00AA6C" : "#DDE3EA",
      }}
    >
      <motion.span
        className="pointer-events-none block h-4 w-4 rounded-full shadow-sm"
        style={{ background: "#ffffff" }}
        animate={{ x: checked ? 22 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ── Pulsing status dot ── */
function StatusDot({ status }: { status: "connected" | "error" | "disconnected" }) {
  const colors: Record<string, string> = {
    connected: "#10B981",
    error: "#EF4444",
    disconnected: "#94A3B8",
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "connected" && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
          style={{ background: colors[status] }}
        />
      )}
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ background: colors[status] }}
      />
    </span>
  );
}

export default function SettingsIntegrationsUI({
  loading,
  error,
  connections,
  mutatingProvider,
  aiConfig,
  groqConfigured,
  savingAiConfig,
  onConnect,
  onSync,
  onDisconnect,
  onUpdateAiConfig,
  onRefresh,
}: SettingsIntegrationsUIProps) {
  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* ─── Header ─── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Integration Layer</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Integrations
          </h2>
        </div>
        <motion.button
          type="button"
          onClick={() => void onRefresh()}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200"
          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#00AA6C";
            e.currentTarget.style.background = "#F4F6F8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "#ffffff";
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
            style={{ color: "#00AA6C" }}
          />
          Refresh
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp} className="fault-line" />

      {/* ─── Error banner ─── */}
      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}
            >
              {error}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ─── Connect New Integrations ─── */}
      <motion.div variants={fadeUp} className="panel overflow-hidden">
        <div
          className="flex items-center gap-3 border-b px-5 py-3"
          style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded"
            style={{ background: "#00AA6C12", border: "1px solid #00AA6C25" }}
          >
            <Plug size={14} style={{ color: "#00AA6C" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
              Connected Services
            </p>
            <p className="text-xs" style={{ color: "#5A6A7A" }}>
              Link external accounts and sync data
            </p>
          </div>
        </div>

        <div className="p-5">
          {/* Connect buttons — rendered as cards */}
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {(["gmail", "google-calendar"] as const)
              .filter((provider) => !connections.some((conn) => conn.provider === provider || conn.provider === provider.replace("-", "_")))
              .map((provider, i) => {
              const meta = providerMeta[provider];
              const Icon = meta.icon;
              return (
                <motion.button
                  key={provider}
                  type="button"
                  onClick={() => void onConnect(provider)}
                  disabled={mutatingProvider === provider}
                  variants={fadeUp}
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(26, 26, 26, 0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-3 rounded-lg border p-4 text-left transition-colors duration-200 disabled:opacity-60"
                  style={{ borderColor: "var(--border)", background: "#ffffff" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = meta.color + "60";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: meta.bg, border: `1px solid ${meta.color}20` }}
                  >
                    <Icon size={18} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                      Connect {meta.label}
                    </p>
                    <p className="text-xs" style={{ color: "#5A6A7A" }}>
                      {provider === "gmail" ? "Email sync & inbox" : "Calendar events & bookings"}
                    </p>
                  </div>
                  <Link2
                    size={14}
                    className="ml-auto opacity-0 transition-opacity duration-200 group-hover:opacity-60"
                    style={{ color: "#5A6A7A" }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Connection list */}
          <AnimatePresence mode="popLayout">
            {connections.map((connection, i) => {
              const meta = providerMeta[connection.provider] ?? {
                icon: Link2,
                color: "#2563EB",
                bg: "#2563EB10",
                label: connection.provider.replace("_", " "),
              };
              const Icon = meta.icon;
              const isActive = connection.status === "connected";

              return (
                <motion.div
                  key={connection.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-all duration-200"
                  style={{
                    borderColor: "var(--border)",
                    background: "#ffffff",
                    borderLeftWidth: "3px",
                    borderLeftColor: isActive ? meta.color : "var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: meta.bg, border: `1px solid ${meta.color}20` }}
                    >
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                        {meta.label}
                        <StatusDot status={connection.status} />
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "#5A6A7A" }}>
                        {connection.lastSyncAt
                          ? `Synced ${formatDateTime(connection.lastSyncAt)}`
                          : "Never synced"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge tone={toneFromStatus(connection.status)} label={connection.status} />
                    <motion.button
                      type="button"
                      onClick={() => void onSync(connection.id)}
                      disabled={mutatingProvider === connection.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                      style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#00AA6C";
                        e.currentTarget.style.background = "#00AA6C08";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <RefreshCw
                        size={11}
                        className={mutatingProvider === connection.id ? "animate-spin" : ""}
                      />
                      Sync
                    </motion.button>
                    {connection.status === "disconnected" ? (
                      <motion.button
                        type="button"
                        onClick={() => void onConnect(connection.provider.replace("_", "-") as "gmail" | "google-calendar")}
                        disabled={mutatingProvider === connection.provider}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                        style={{ borderColor: "#00AA6C30", color: "#00AA6C" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ECFDF5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Link2 size={11} />
                        Connect
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={() => void onDisconnect(connection.id)}
                        disabled={mutatingProvider === connection.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                        style={{ borderColor: "#EF444430", color: "#EF4444" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Unplug size={11} />
                        Disconnect
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {!connections.length && !loading ? (
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#00AA6C08", border: "1px solid #00AA6C15" }}
              >
                <Plug size={20} style={{ color: "#00AA6C" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                No integrations connected
              </p>
              <p className="mt-1 text-xs" style={{ color: "#5A6A7A" }}>
                Connect a service above to get started
              </p>
            </motion.div>
          ) : null}

          {/* Loading skeleton */}
          {loading && !connections.length ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                  className="h-16 rounded-lg"
                  style={{ background: "#EEF1F4" }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* ─── AI Configuration ─── */}
      <motion.div variants={fadeUp} className="panel overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-3"
          style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded"
              style={{ background: "#7C3AED12", border: "1px solid #7C3AED25" }}
            >
              <Sparkles size={14} style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                AI Assistance
              </p>
              <p className="text-xs" style={{ color: "#5A6A7A" }}>
                Powered by Groq — {groqConfigured ? "API key detected" : "API key missing"}
              </p>
            </div>
          </div>
          <StatusBadge
            tone={groqConfigured ? "success" : "warning"}
            label={groqConfigured ? "configured" : "missing key"}
          />
        </div>

        <div className="space-y-1 p-5">
          {[
            {
              key: "contactAutoReplyEnabled" as const,
              title: "AI custom replies for contact submissions",
              description: "Replaces hardcoded acknowledgement with AI-generated reply when available.",
              icon: Zap,
              color: "#F59E0B",
            },
            {
              key: "inboxReplyAssistEnabled" as const,
              title: "AI reply assist in inbox conversations",
              description: "Lets staff generate AI draft replies in conversation view.",
              icon: Sparkles,
              color: "#7C3AED",
            },
          ].map((feature, i) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.label
                key={feature.key}
                variants={fadeUp}
                whileHover={{ x: 2 }}
                className="group flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-all duration-200"
                style={{ borderColor: "var(--border)", background: "#ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = feature.color + "40";
                  e.currentTarget.style.background = feature.color + "04";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: feature.color + "10",
                      border: `1px solid ${feature.color}20`,
                    }}
                  >
                    <FeatureIcon size={14} style={{ color: feature.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "#5A6A7A" }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={aiConfig[feature.key]}
                  disabled={savingAiConfig}
                  onChange={(next) => void onUpdateAiConfig({ [feature.key]: next })}
                />
              </motion.label>
            );
          })}
        </div>
      </motion.div>

      {/* Subtle bottom vein accent */}
      <motion.div variants={fadeUp} className="vein-accent mx-auto w-2/3" />
    </motion.div>
  );
}
