"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSessionState,
} from "@/lib/session";
import { getMe } from "@/lib/api/client";
import styles from "./page.module.css";

interface FeatureItem {
  title: string;
  detail: string;
  icon: LucideIcon;
}

/* ── Shared content data ── */
const features: FeatureItem[] = [
  {
    title: "Unified Inbox",
    detail:
      "Email and SMS threads in one operator view with automation pause controls.",
    icon: MessagesSquare,
  },
  {
    title: "Booking Ops",
    detail:
      "Service slots, confirmation workflows, and same-day status updates.",
    icon: CalendarRange,
  },
  {
    title: "Inventory Signals",
    detail:
      "Threshold alerts tied directly to bookings and daily workload.",
    icon: ShieldCheck,
  },
];

/* ── Shared structural primitives ── */
function VariantFooter({
  borderColor,
  textColor,
}: {
  borderColor: string;
  textColor: string;
}) {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: `1px solid ${borderColor}`,
        paddingTop: "1rem",
        fontSize: "0.75rem",
        color: textColor,
      }}
    >
      <span>CareOps MVP Frontend</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Building2 size={14} />
        Built for service teams
      </span>
    </footer>
  );
}

function VariantCTA({
  primaryClass,
  secondaryClass,
}: {
  primaryClass: string;
  secondaryClass: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/signup" className={primaryClass}>
        Create Workspace
        <ArrowRight size={16} />
      </Link>
      <Link href="/login" className={secondaryClass}>
        Sign In
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIANT 01 — STRATA  (Geological Cross-Section)

   Horizontal layered bands of color representing geological
   strata. Content excavated through erosion windows. Diagonal
   fault lines divide sections. Features rendered as extracted
   core samples with colored side borders per depth layer.
   Green topsoil → limestone → mineral veins → aquifer → bedrock.
   ═══════════════════════════════════════════════════════════════ */
function StrataVariant() {
  const session = useSyncExternalStore(
    subscribeSessionState,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<string | null>(null);
  const [workspaceChecked, setWorkspaceChecked] = useState(false);
  const layerColors = ["#00AA6C", "#FFD500", "#2563EB"];
  const sessionWorkspaceId = session.workspaceId?.trim() ?? "";
  const workspaceId = workspaceChecked ? resolvedWorkspaceId : null;

  useEffect(() => {
    let active = true;

    const resolveWorkspace = async () => {
      if (!session.token) {
        if (!active) {
          return;
        }
        setResolvedWorkspaceId(null);
        setWorkspaceChecked(true);
        return;
      }

      try {
        const me = await getMe();
        if (!active) {
          return;
        }

        const matchedWorkspace = sessionWorkspaceId
          ? me.workspaces.find((workspace) => workspace.id === sessionWorkspaceId)
          : me.workspaces[0];
        setResolvedWorkspaceId(matchedWorkspace?.id ?? null);
      } catch {
        if (!active) {
          return;
        }
        setResolvedWorkspaceId(null);
      } finally {
        if (active) {
          setWorkspaceChecked(true);
        }
      }
    };

    setWorkspaceChecked(false);
    void resolveWorkspace();

    return () => {
      active = false;
    };
  }, [session.token, sessionWorkspaceId]);

  const publicLinks = useMemo(
    () => [
      { href: workspaceId ? `/f/${workspaceId}/contact` : null, label: "Contact Form" },
      { href: workspaceId ? `/b/${workspaceId}` : null, label: "Booking Page" },
    ],
    [workspaceId],
  );

  return (
    <main className="min-h-screen" style={{ background: "#F4F6F8", overflowX: "hidden" }}>
      {/* ─── Topsoil band: Hero ─── */}
      <div
        className={styles.strataTopBand}
        style={{ background: "#00AA6C", paddingBottom: "4rem" }}
      >
        {/* Mineral vein pulse */}
        <div className={styles.strataVein} />

        <div
          className="relative z-[2] mx-auto max-w-6xl px-6 pt-14 sm:px-10"
          style={{ fontFamily: "var(--font-plex)" }}
        >
          {/* Layer identifier */}
          <div className="mb-10 flex items-center gap-3">
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "2px",
                background: "#FFD500",
                transform: "rotate(45deg)",
              }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.45em]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Stratum 001 — Surface Operations
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl font-bold leading-[1.02] sm:text-7xl"
            style={{ color: "#FFFFFF" }}
          >
            Beneath the
            <br />
            surface,{" "}
            <span style={{ color: "#FFD500" }}>clarity</span>
          </h1>

          <p
            className="mt-7 max-w-md text-base leading-[1.85]"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Drill through siloed workflows. Unified operations for leads,
            bookings, forms, messaging, and inventory — every layer exposed,
            every signal extracted.
          </p>

          <div className="mt-9">
            <VariantCTA
              primaryClass="inline-flex items-center gap-2 bg-[#FFD500] text-[#1A1A1A] px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:bg-[#e6bf00] hover:shadow-lg"
              secondaryClass="px-7 py-3.5 text-sm font-medium text-white/70 border border-white/25 transition-all duration-200 hover:text-white hover:border-white/50"
            />
          </div>
        </div>
      </div>

      {/* ─── Fault line transition ─── */}
      <div className={styles.strataFault} />

      {/* ─── Limestone layer: Features ─── */}
      <div
        className="relative z-[2] mx-auto max-w-6xl px-6 py-20 sm:px-10"
        style={{ fontFamily: "var(--font-plex)" }}
      >
        <p
          className="mb-3 text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "#00AA6C" }}
        >
          Core Samples — Extracted Modules
        </p>
        <div
          className="mb-12 h-px"
          style={{
            background:
              "linear-gradient(90deg, #00AA6C44 0%, #FFD50033 50%, transparent 100%)",
            maxWidth: "320px",
          }}
        />

        <div className="space-y-10">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={styles.strataFeature}
                style={
                  { "--strata-color": layerColors[i] } as React.CSSProperties
                }
              >
                <div
                  className="absolute left-0 top-[4px] bottom-[4px] w-[4px] rounded-sm"
                  style={{ background: layerColors[i] }}
                />
                <div className="flex items-start gap-4">
                  <div
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded"
                    style={{
                      background: `${layerColors[i]}15`,
                      border: `1px solid ${layerColors[i]}30`,
                    }}
                  >
                    <Icon size={16} style={{ color: layerColors[i] }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: "#1A1A1A" }}
                      >
                        {item.title}
                      </h2>
                      <span
                        className="text-[9px] uppercase tracking-widest"
                        style={{
                          color: layerColors[i],
                          background: `${layerColors[i]}10`,
                          padding: "2px 8px",
                          borderRadius: "2px",
                        }}
                      >
                        DEPTH {String((i + 1) * 120)}m
                      </span>
                    </div>
                    <p
                      className="mt-2 max-w-lg text-sm leading-[1.85]"
                      style={{ color: "#666" }}
                    >
                      {item.detail}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ─── Bedrock layer: Demo links ─── */}
      <div
        className={styles.strataBedrock}
        style={{ background: "#1A1A1A", position: "relative" }}
      >
        <div
          className="relative z-[1] mx-auto max-w-6xl px-6 pb-12 pt-16 sm:px-10"
          style={{ fontFamily: "var(--font-plex)" }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.35em]"
                style={{ color: "#FFD500" }}
              >
                Drill Coordinates — Demo Routes
              </p>
              <p
                className="mt-2 text-xs"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {workspaceId
                  ? "Public links are ready."
                  : workspaceChecked
                    ? "No workspace found. Public links are disabled."
                    : "Loading workspace links..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {publicLinks.map((lnk) => (
                lnk.href ? (
                  <Link
                    key={lnk.label}
                    href={lnk.href}
                    className="text-xs font-medium transition-colors duration-200 hover:text-[#FFD500]"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                      paddingBottom: "2px",
                    }}
                  >
                    {lnk.label}
                  </Link>
                ) : (
                  <span
                    key={lnk.label}
                    className="text-xs font-medium"
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      paddingBottom: "2px",
                      cursor: "not-allowed",
                    }}
                  >
                    {lnk.label}
                  </span>
                )
              ))}
            </div>
          </div>

          <div className="mt-10">
            <VariantFooter
              borderColor="rgba(255,255,255,0.08)"
              textColor="rgba(255,255,255,0.25)"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
/* ── Page export ── */
export default function Home() {
  return <StrataVariant />;
}

