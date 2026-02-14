"use client";

import type { PublicFieldConfig } from "@/lib/api/types";
import type { PublicContactUIProps } from "@/components/PublicContact/types";

const inputClasses = "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors";
const inputStyle = { borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" };
const successPanelStyle = {
  borderColor: "#bfeedd",
  background: "linear-gradient(135deg, #f4fff9 0%, #ebfff5 58%, #ffffff 100%)",
};

function renderField(
  field: PublicFieldConfig,
  value: string | boolean | undefined,
  onChange: (next: string | boolean) => void,
) {
  const type = field.type ?? "text";

  if (type === "textarea") {
    return (
      <textarea
        value={(value as string | undefined) ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder={field.placeholder ?? ""}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors"
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#00AA6C";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      />
    );
  }

  if (type === "checkbox") {
    return (
      <label className="mt-2 inline-flex items-center gap-2 text-sm" style={{ color: "#1A1A1A" }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded accent-[#00AA6C]"
          style={{ borderColor: "var(--border)" }}
        />
        {field.label}
      </label>
    );
  }

  return (
    <input
      type={type}
      value={(value as string | undefined) ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder ?? ""}
      className={inputClasses}
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#00AA6C";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    />
  );
}

export default function PublicContactUI({
  fieldValues,
  publicFlowConfig,
  loading,
  error,
  successMessage,
  onFieldChange,
  onSubmit,
}: PublicContactUIProps) {
  const contactFields = publicFlowConfig.contact.fields;
  const completed = Boolean(successMessage);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-8" style={{ background: "var(--background-gray)" }}>
      <section className="panel w-full p-6">
        <p className="stratum-header">CareOps Public Form</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ color: "#1A1A1A" }}>
          Contact Us
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
          Send your request and our team will reply shortly.
        </p>

        <div className="mt-4 mb-5 h-[2px]" style={{ background: "linear-gradient(90deg, #00AA6C, #FFD500 50%, transparent)" }} />

        {loading ? (
          <div className="public-progress-panel mb-4 rounded-lg p-3" role="status" aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "#007f50" }}>
              Sending your message
            </p>
            <div className="public-progress-bar mt-2" />
          </div>
        ) : null}

        {!completed && contactFields.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {contactFields.map((field, index) => {
              const checkbox = field.type === "checkbox";
              return (
                <label
                  key={field.key}
                  className={`public-field-reveal text-sm ${checkbox || field.type === "textarea" ? "sm:col-span-2" : ""}`}
                  style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                >
                  {!checkbox ? (
                    <span style={{ color: "#1A1A1A" }}>
                      {field.label}
                      {field.required ? <span style={{ color: "#EF4444" }}> *</span> : null}
                    </span>
                  ) : null}
                  {renderField(field, fieldValues[field.key], (next) => onFieldChange(field.key, next))}
                </label>
              );
            })}
          </div>
        ) : !completed ? (
          <p className="text-sm" style={{ color: "#5A6A7A" }}>
            This contact form has no custom fields configured by the owner.
          </p>
        ) : null}

        {successMessage ? (
          <div
            className="public-success-panel mt-4 rounded-xl border p-5"
            style={successPanelStyle}
            role="status"
            aria-live="polite"
          >
            <div className="public-success-badge" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-semibold" style={{ color: "#045d3c" }}>
              Message delivered
            </p>
            <p className="mt-1 text-sm" style={{ color: "#0b7a51" }}>
              {successMessage}
            </p>
            <p className="mt-2 text-xs" style={{ color: "#3f6e5b" }}>
              Our team will follow up soon.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm" style={{ color: "#EF4444" }}>{error}</p> : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={loading || completed}
          className="public-submit-button mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          data-loading={loading ? "true" : "false"}
          aria-busy={loading}
        >
          <span className="inline-flex items-center gap-2">
            {loading ? <span className="public-submit-spinner" aria-hidden="true" /> : null}
            {completed ? "Sent" : loading ? "Sending" : "Submit"}
          </span>
        </button>
      </section>
    </main>
  );
}

