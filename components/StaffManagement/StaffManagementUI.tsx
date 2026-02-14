"use client";

import { RefreshCw } from "lucide-react";
import type { StaffManagementUIProps } from "@/components/StaffManagement/types";

export default function StaffManagementUI({
  loading,
  error,
  success,
  workspaceId,
  members,
  draft,
  creating,
  mutatingMemberId,
  onDraftChange,
  onCreateStaff,
  onToggleRole,
  onRemoveMember,
  onRefresh,
}: StaffManagementUIProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Access Layer</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>Staff Management</h2>
          <p className="mt-1 text-xs" style={{ color: "#5A6A7A" }}>
            Workspace: {workspaceId ?? "not available"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all duration-200"
          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#00AA6C" }} />
          Refresh
        </button>
      </div>

      <div className="fault-line" />

      {error ? (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#EF444440", background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#00AA6C40", background: "#ECFDF5", color: "#065F46" }}>
          {success}
        </div>
      ) : null}

      <section className="panel p-4">
        <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Create Staff Account</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Full Name</span>
            <input
              value={draft.name}
              onChange={(event) => onDraftChange("name", event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="Alex Johnson"
            />
          </label>
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Email</span>
            <input
              value={draft.email}
              onChange={(event) => onDraftChange("email", event.target.value)}
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="staff@clinic.com"
            />
          </label>
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Temporary Password</span>
            <input
              value={draft.password}
              onChange={(event) => onDraftChange("password", event.target.value)}
              type="password"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="At least 8 characters"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void onCreateStaff()}
          disabled={creating}
          className="mt-4 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{ background: "#00AA6C", color: "#fff" }}
        >
          {creating ? "Creating..." : "Create staff account"}
        </button>
      </section>

      <section className="panel p-4">
        <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Workspace Members</h3>
        <div className="mt-3 space-y-2">
          {members.map((member) => (
            <article
              key={member.id}
              className="rounded-md border p-3"
              style={{ borderColor: "var(--border)", background: "#fff" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {member.user?.name ?? "Unknown User"} ({member.role})
                  </p>
                  <p className="text-xs" style={{ color: "#5A6A7A" }}>{member.user?.email ?? "No email"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onToggleRole(member)}
                    disabled={mutatingMemberId === member.id}
                    className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-60"
                    style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                  >
                    {member.role === "staff" ? "Promote to owner" : "Demote to staff"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onRemoveMember(member)}
                    disabled={mutatingMemberId === member.id}
                    className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-60"
                    style={{ borderColor: "#EF444440", color: "#EF4444" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!members.length ? (
            <p className="text-sm" style={{ color: "#5A6A7A" }}>No members found.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

