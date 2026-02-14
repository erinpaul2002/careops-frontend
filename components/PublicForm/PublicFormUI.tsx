"use client";

import type { FormTemplateField, UploadedFormFile } from "@/lib/api/types";
import { formatDateOnly } from "@/lib/format";
import { fieldKey, isUploadedFile } from "@/components/PublicForm/usePublicForm";
import type { PublicFormUIProps } from "@/components/PublicForm/types";

const inputClasses = "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors";
const inputStyle = { borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" };
const successPanelStyle = {
  borderColor: "#bfeedd",
  background: "linear-gradient(135deg, #f4fff9 0%, #ebfff5 58%, #ffffff 100%)",
};

function renderField(
  field: FormTemplateField,
  key: string,
  value: string | boolean | UploadedFormFile | undefined,
  onChange: (next: string | boolean) => void,
  onFileChange: (key: string, file: File | null) => Promise<void>,
  uploading: boolean,
) {
  const type = (field.type ?? "text").toLowerCase();
  if (type === "textarea") {
    return (
      <textarea
        value={(value as string | undefined) ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
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

  if (type === "file") {
    const uploaded = extractUploaded(value);
    return (
      <div className="mt-1 space-y-2">
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            void onFileChange(key, selected);
          }}
          disabled={uploading}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60"
          style={inputStyle}
        />
        {uploading ? (
          <p className="text-xs" style={{ color: "#5A6A7A" }}>
            Uploading file...
          </p>
        ) : null}
        {uploaded ? (
          <p className="text-xs" style={{ color: "#00AA6C" }}>
            Uploaded: {uploaded.fileName}
          </p>
        ) : null}
      </div>
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

function extractUploaded(value: unknown): { fileName: string } | null {
  if (!isUploadedFile(value)) {
    return null;
  }
  return { fileName: value.fileName };
}

export default function PublicFormUI({
  token,
  loading,
  submitting,
  uploadingFieldKey,
  error,
  successMessage,
  payload,
  values,
  onChange,
  onFileChange,
  onSubmit,
}: PublicFormUIProps) {
  const completed = Boolean(successMessage);

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-8"
      style={{ background: "var(--background-gray)" }}
    >
      <section className="panel w-full p-6">
        <p className="stratum-header">CareOps Form</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ color: "#1A1A1A" }}>
          Form Request
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
          Token: {token}
        </p>

        <div
          className="mt-4 mb-5 h-[2px]"
          style={{ background: "linear-gradient(90deg, #00AA6C, #FFD500 50%, transparent)" }}
        />

        {loading ? (
          <p className="mt-4 text-sm" style={{ color: "#5A6A7A" }}>
            Loading form...
          </p>
        ) : null}

        {submitting ? (
          <div className="public-progress-panel mt-4 rounded-lg p-3" role="status" aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "#007f50" }}>
              Submitting your response
            </p>
            <div className="public-progress-bar mt-2" />
          </div>
        ) : null}

        {!loading && payload && !completed ? (
          <div className="space-y-4">
            <div
              className="rounded-md border p-3"
              style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
            >
              <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                {payload.template.name}
              </p>
              <p className="text-xs" style={{ color: "#5A6A7A" }}>
                Due: {formatDateOnly(payload.formRequest.dueAt)}
              </p>
            </div>

            {payload.template.fields.map((field, index) => {
              const key = fieldKey(field) || `field_${index}`;
              const label = field.label ?? field.name ?? key;
              const checkbox = (field.type ?? "").toLowerCase() === "checkbox";

              return (
                <label
                  key={key}
                  className="public-field-reveal block text-sm"
                  style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                >
                  {!checkbox ? (
                    <span style={{ color: "#1A1A1A" }}>
                      {label}
                      {field.required ? (
                        <span className="ml-1" style={{ color: "#EF4444" }}>
                          *
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {renderField(
                    field,
                    key,
                    values[key],
                    (next) => onChange(key, next),
                    onFileChange,
                    uploadingFieldKey === key,
                  )}
                </label>
              );
            })}
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm" style={{ color: "#EF4444" }}>
            {error}
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
              Submission complete
            </p>
            <p className="mt-1 text-sm" style={{ color: "#0b7a51" }}>
              {successMessage}
            </p>
            <p className="mt-2 text-xs" style={{ color: "#3f6e5b" }}>
              We captured your response successfully.
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={submitting || loading || !payload || Boolean(uploadingFieldKey) || completed}
          className="public-submit-button mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          data-loading={submitting ? "true" : "false"}
          aria-busy={submitting}
        >
          <span className="inline-flex items-center gap-2">
            {submitting ? <span className="public-submit-spinner" aria-hidden="true" /> : null}
            {completed ? "Submitted" : submitting ? "Submitting" : "Submit Form"}
          </span>
        </button>
      </section>
    </main>
  );
}
