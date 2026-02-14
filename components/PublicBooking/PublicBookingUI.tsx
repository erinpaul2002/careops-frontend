"use client";

import { formatDateTimeRange } from "@/lib/format";
import type { PublicFieldConfig } from "@/lib/api/types";
import type { PublicBookingUIProps } from "@/components/PublicBooking/types";

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
        rows={4}
        value={(value as string | undefined) ?? ""}
        onChange={(event) => onChange(event.target.value)}
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

export default function PublicBookingUI({
  services,
  selectedServiceId,
  date,
  slotTimezone,
  slots,
  selectedStartsAt,
  fieldValues,
  publicFlowConfig,
  loading,
  slotLoading,
  error,
  successMessage,
  onMetaChange,
  onFieldChange,
  onSubmit,
}: PublicBookingUIProps) {
  const bookingFields = publicFlowConfig.booking.fields;
  const completed = Boolean(successMessage);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-5 py-8" style={{ background: "var(--background-gray)" }}>
      <section className="panel w-full p-6">
        <p className="stratum-header">CareOps Public Booking</p>
        <h1 className="mt-2 text-3xl font-semibold" style={{ color: "#1A1A1A" }}>
          Book Appointment
        </h1>

        <div className="mt-4 mb-5 h-[2px]" style={{ background: "linear-gradient(90deg, #00AA6C, #FFD500 50%, #2563EB 80%, transparent)" }} />

        {loading ? (
          <div className="public-progress-panel mb-4 rounded-lg p-3" role="status" aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "#007f50" }}>
              Confirming your booking
            </p>
            <div className="public-progress-bar mt-2" />
          </div>
        ) : null}

        <div className="space-y-4">
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Service</span>
            <select
              value={selectedServiceId}
              onChange={(event) => void onMetaChange("selectedServiceId", event.target.value)}
              className={inputClasses}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#00AA6C";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.durationMin} min)
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => void onMetaChange("date", event.target.value)}
              className={inputClasses}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#00AA6C";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />
          </label>

          <div>
            <p className="text-sm" style={{ color: "#1A1A1A" }}>Available Slots</p>
            <p className="mt-1 text-xs" style={{ color: "#5A6A7A" }}>
              Showing times in {slotTimezone}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {slotLoading ? <p className="text-xs" style={{ color: "#5A6A7A" }}>Loading slots...</p> : null}
              {!slotLoading &&
                slots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => void onMetaChange("selectedStartsAt", slot.startsAt)}
                    className="rounded-md border px-3 py-2 text-xs transition-all duration-200"
                    style={
                      selectedStartsAt === slot.startsAt
                        ? { borderColor: "#00AA6C", background: "#00AA6C10", color: "#00AA6C", fontWeight: 600 }
                        : { borderColor: "var(--border)", color: "#1A1A1A" }
                    }
                  >
                    {formatDateTimeRange(slot.startsAt, slot.endsAt, slotTimezone)}
                  </button>
                ))}
            </div>
          </div>

          {!slotLoading && slots.length === 0 ? (
            <div className="mt-6 rounded-lg border-2 border-dashed p-8 text-center" style={{ borderColor: "#EF4444", background: "#FEF2F2" }}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "#EF4444", color: "#ffffff" }}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#DC2626" }}>No Slots Available</h3>
              <p className="mt-2 text-sm" style={{ color: "#7F1D1D" }}>
                There are no available time slots for the selected date and service. Please choose a different date or service to continue with your booking.
              </p>
            </div>
          ) : (
            <>
              {bookingFields.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {bookingFields.map((field, index) => {
                    const checkbox = field.type === "checkbox";
                    return (
                      <label
                        key={field.key}
                        className={`public-field-reveal text-sm ${checkbox ? "sm:col-span-2" : ""}`}
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
              ) : (
                <p className="text-sm" style={{ color: "#5A6A7A" }}>
                  This booking form has no custom fields configured by the owner.
                </p>
              )}

              {error ? <p className="mt-3 text-sm" style={{ color: "#EF4444" }}>{error}</p> : null}
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
                    Booking confirmed
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "#0b7a51" }}>
                    {successMessage}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "#3f6e5b" }}>
                    Watch for a confirmation message from this workspace.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={loading || !selectedStartsAt || completed}
                className="public-submit-button mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                data-loading={loading ? "true" : "false"}
                aria-busy={loading}
              >
                <span className="inline-flex items-center gap-2">
                  {loading ? <span className="public-submit-spinner" aria-hidden="true" /> : null}
                  {completed ? "Booked" : loading ? "Booking" : "Confirm Booking"}
                </span>
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}


