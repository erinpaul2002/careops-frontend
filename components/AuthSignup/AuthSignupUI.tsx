"use client";

import Link from "next/link";
import TimezoneSelect from "react-timezone-select";
import type { AuthSignupUIProps } from "@/components/AuthSignup/types";

const inputClasses = "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors";
const inputStyle = { borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" };

export default function AuthSignupUI({
  name,
  email,
  password,
  workspaceName,
  timezone,
  loading,
  error,
  onChange,
  onSubmit,
}: AuthSignupUIProps) {
  const timezoneSelectId = "signup-timezone-select";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-5 py-8" style={{ background: "var(--background-gray)" }}>
      <section className="panel w-full p-6">
        <p className="stratum-header">CareOps</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ color: "#1A1A1A" }}>Create Workspace</h1>
        <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>Set up your owner account and start onboarding.</p>

        <div className="mt-4 mb-5 h-[2px]" style={{ background: "linear-gradient(90deg, #00AA6C, #FFD500 50%, #2563EB 80%, transparent)" }} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span style={{ color: "#1A1A1A" }}>Owner Name</span>
            <input
              value={name}
              onChange={(event) => onChange("name", event.target.value)}
              className={inputClasses}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00AA6C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span style={{ color: "#1A1A1A" }}>Email</span>
            <input
              value={email}
              type="email"
              onChange={(event) => onChange("email", event.target.value)}
              className={inputClasses}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00AA6C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span style={{ color: "#1A1A1A" }}>Password</span>
            <input
              value={password}
              type="password"
              onChange={(event) => onChange("password", event.target.value)}
              className={inputClasses}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00AA6C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span style={{ color: "#1A1A1A" }}>Workspace Name</span>
            <input
              value={workspaceName}
              onChange={(event) => onChange("workspaceName", event.target.value)}
              className={inputClasses}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00AA6C"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span style={{ color: "#1A1A1A" }}>Timezone</span>
            <div className="mt-1 text-sm">
              <TimezoneSelect
                value={timezone}
                onChange={(selectedTimezone) => onChange("timezone", selectedTimezone.value)}
                instanceId={timezoneSelectId}
                inputId={`${timezoneSelectId}-input`}
                labelStyle="abbrev"
                displayValue="UTC"
                classNamePrefix="careops-timezone"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: 6,
                    minHeight: 38,
                    borderColor: state.isFocused ? "#00AA6C" : "var(--border)",
                    boxShadow: "none",
                    backgroundColor: "#ffffff",
                    "&:hover": { borderColor: "#00AA6C" },
                  }),
                  input: (base) => ({ ...base, color: "#1A1A1A" }),
                  singleValue: (base) => ({ ...base, color: "#1A1A1A" }),
                  menu: (base) => ({ ...base, zIndex: 30 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? "#F3FAF7" : "#ffffff",
                    color: "#1A1A1A",
                  }),
                }}
              />
            </div>
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
          {loading ? "Creating" : "Create Workspace"}
        </button>

        <p className="mt-4 text-center text-sm" style={{ color: "#5A6A7A" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#00AA6C", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
