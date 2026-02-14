"use client";

import Link from "next/link";
import type { AuthLoginUIProps } from "@/components/AuthLogin/types";

export default function AuthLoginUI({
  mode,
  email,
  password,
  loading,
  error,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthLoginUIProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-8" style={{ background: "var(--background-gray)" }}>
      <section className="panel w-full p-6">
        <p className="stratum-header">CareOps</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ color: "#1A1A1A" }}>Sign In</h1>
        <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
          {mode === "owner" ? "Owner access for setup and controls." : "Staff access for day-to-day operations."}
        </p>

        <div className="mt-4 mb-5 h-[2px]" style={{ background: "linear-gradient(90deg, #00AA6C, #FFD500 50%, transparent)" }} />

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-md border p-1" style={{ borderColor: "var(--border)", background: "#F6F8FA" }}>
          <button
            type="button"
            onClick={() => onModeChange("owner")}
            className="rounded px-3 py-2 text-sm font-medium transition-all duration-200"
            style={
              mode === "owner"
                ? { background: "#ffffff", color: "#00AA6C", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }
                : { color: "#5A6A7A" }
            }
          >
            Owner Login
          </button>
          <button
            type="button"
            onClick={() => onModeChange("staff")}
            className="rounded px-3 py-2 text-sm font-medium transition-all duration-200"
            style={
              mode === "staff"
                ? { background: "#ffffff", color: "#00AA6C", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }
                : { color: "#5A6A7A" }
            }
          >
            Staff Login
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Email</span>
            <input
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00AA6C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              placeholder={mode === "owner" ? "owner@clinic.com" : "staff@clinic.com"}
            />
          </label>

          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Password</span>
            <input
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              type="password"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00AA6C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              placeholder="********"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm" style={{ color: "#EF4444" }}>{error}</p> : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={loading}
          className="mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{ background: "#00AA6C", color: "#ffffff" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#009960"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#00AA6C"; }}
        >
          {loading ? "Signing In" : "Sign In"}
        </button>

        {mode === "owner" ? (
          <p className="mt-4 text-center text-sm" style={{ color: "#5A6A7A" }}>
            New workspace?{" "}
            <Link href="/signup" style={{ color: "#00AA6C", fontWeight: 500 }}>
              Create account
            </Link>
          </p>
        ) : (
          <p className="mt-4 text-center text-sm" style={{ color: "#5A6A7A" }}>
            Use your staff email and password provided by your workspace owner.
          </p>
        )}
      </section>
    </main>
  );
}

