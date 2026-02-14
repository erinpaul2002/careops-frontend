"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  Search,
  StickyNote,
  UserRound,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BookingsUIProps } from "@/components/Bookings/types";
import type { Booking, BookingStatus } from "@/lib/api/types";
import { formatDateOnly, formatDateTime } from "@/lib/format";

const statusOptions: Array<"all" | BookingStatus> = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const transitions: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function toneForStatus(status: BookingStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "confirmed" || status === "completed") {
    return "success";
  }
  if (status === "pending") {
    return "warning";
  }
  if (status === "cancelled" || status === "no_show") {
    return "danger";
  }
  return "neutral";
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Not provided";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "string") {
    return value.trim().length ? value : "Not provided";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatFieldLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function matchesQuery(booking: Booking, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const values = [
    booking.id,
    booking.contact?.firstName,
    booking.contact?.lastName,
    booking.contact?.email,
    booking.contact?.phone,
    booking.service?.name,
  ];

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function objectEntries(value: unknown): Array<[string, unknown]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value as Record<string, unknown>);
}

export default function BookingsUI({
  loading,
  error,
  bookings,
  statusFilter,
  mutatingBookingId,
  onStatusFilterChange,
  onUpdateStatus,
  onRefresh,
}: BookingsUIProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => matchesQuery(booking, searchQuery)),
    [bookings, searchQuery],
  );

  const selectedBooking = useMemo(() => {
    if (!filteredBookings.length) {
      return null;
    }
    if (!selectedBookingId) {
      return filteredBookings[0];
    }
    return filteredBookings.find((booking) => booking.id === selectedBookingId) ?? filteredBookings[0];
  }, [filteredBookings, selectedBookingId]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
      completed: bookings.filter((booking) => booking.status === "completed").length,
      attention: bookings.filter((booking) => booking.status === "cancelled" || booking.status === "no_show")
        .length,
    }),
    [bookings],
  );

  const selectedCustomFieldEntries = objectEntries(selectedBooking?.customFields);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Schedule Layer - Booking Records</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Bookings
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#5A6A7A" }}
          >
            <Search size={14} style={{ color: "#00AA6C" }} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search customer or service"
              className="w-44 bg-transparent outline-none sm:w-56"
              style={{ color: "#1A1A1A" }}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => void onStatusFilterChange(event.target.value as "all" | BookingStatus)}
            className="rounded-md border px-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : humanize(option)}
              </option>
            ))}
          </select>

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
      </div>

      <div className="fault-line" />

      {error ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}
        >
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="metric-tile p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>
            Total
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            {stats.total}
          </p>
        </article>

        <article className="metric-tile p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>
            Pending
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#F59E0B" }}>
            {stats.pending}
          </p>
        </article>

        <article className="metric-tile p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>
            Confirmed
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#2563EB" }}>
            {stats.confirmed}
          </p>
        </article>

        <article className="metric-tile p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>
            Completed
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#00AA6C" }}>
            {stats.completed}
          </p>
        </article>

        <article className="metric-tile p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>
            Needs Attention
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#EF4444" }}>
            {stats.attention}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <article className="panel overflow-hidden">
          <header
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={14} style={{ color: "#00AA6C" }} />
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                Booking Queue
              </p>
            </div>
            <p className="text-xs" style={{ color: "#5A6A7A" }}>
              {filteredBookings.length} shown
              {filteredBookings.length !== bookings.length ? ` of ${bookings.length}` : ""}
            </p>
          </header>

          <div className="max-h-[540px] overflow-y-auto p-3">
            {filteredBookings.length ? (
              <div className="space-y-2">
                {filteredBookings.map((booking) => {
                  const selected = booking.id === selectedBooking?.id;
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => setSelectedBookingId(booking.id)}
                      className="w-full rounded-md border p-3 text-left transition-all duration-150"
                      style={{
                        borderColor: selected ? "#00AA6C66" : "var(--border)",
                        background: selected ? "#00AA6C10" : "#ffffff",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium" style={{ color: "#1A1A1A" }}>
                          {booking.contact
                            ? `${booking.contact.firstName} ${booking.contact.lastName}`
                            : "Unknown customer"}
                        </p>
                        <StatusBadge tone={toneForStatus(booking.status)} label={humanize(booking.status)} />
                      </div>

                      <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
                        {booking.service?.name ?? "Service"}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.08em]" style={{ color: "#5A6A7A" }}>
                        Starts {formatDateTime(booking.startsAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-md border px-4 py-6 text-sm"
                style={{ borderColor: "var(--border)", color: "#5A6A7A" }}
              >
                No bookings found.
              </div>
            )}
          </div>
        </article>

        <article className="panel overflow-hidden">
          <header
            className="flex items-center gap-2 border-b px-4 py-3"
            style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
          >
            <CalendarClock size={14} style={{ color: "#2563EB" }} />
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
              Booking Detail
            </p>
          </header>

          {selectedBooking ? (
            <div className="space-y-4 p-4">
              <section
                className="rounded-md border p-3"
                style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                    Overview
                  </p>
                  <StatusBadge
                    tone={toneForStatus(selectedBooking.status)}
                    label={humanize(selectedBooking.status)}
                  />
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "#5A6A7A" }}>Booking ID</dt>
                    <dd className="font-medium" style={{ color: "#1A1A1A" }}>
                      {selectedBooking.id}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="inline-flex items-center gap-1.5" style={{ color: "#5A6A7A" }}>
                      <Clock3 size={13} />
                      Starts
                    </dt>
                    <dd style={{ color: "#1A1A1A" }}>{formatDateTime(selectedBooking.startsAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "#5A6A7A" }}>Ends</dt>
                    <dd style={{ color: "#1A1A1A" }}>{formatDateTime(selectedBooking.endsAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "#5A6A7A" }}>Service</dt>
                    <dd style={{ color: "#1A1A1A" }}>{selectedBooking.service?.name ?? "Service"}</dd>
                  </div>
                  {selectedBooking.service?.durationMin ? (
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "#5A6A7A" }}>Duration</dt>
                      <dd style={{ color: "#1A1A1A" }}>{selectedBooking.service.durationMin} minutes</dd>
                    </div>
                  ) : null}
                  {selectedBooking.service?.locationType ? (
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "#5A6A7A" }}>Location</dt>
                      <dd style={{ color: "#1A1A1A" }}>{humanize(selectedBooking.service.locationType)}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Customer
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="inline-flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                    <UserRound size={14} style={{ color: "#00AA6C" }} />
                    {selectedBooking.contact
                      ? `${selectedBooking.contact.firstName} ${selectedBooking.contact.lastName}`
                      : "Unknown customer"}
                  </p>
                  <p className="inline-flex items-center gap-2" style={{ color: "#5A6A7A" }}>
                    <Mail size={14} />
                    {selectedBooking.contact?.email ?? "No email"}
                  </p>
                  <p className="inline-flex items-center gap-2" style={{ color: "#5A6A7A" }}>
                    <Phone size={14} />
                    {selectedBooking.contact?.phone ?? "No phone"}
                  </p>
                </div>
              </section>

              <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Intake Details
                </p>

                {selectedBooking.notes ? (
                  <div
                    className="mt-3 rounded border px-2 py-1.5 text-xs"
                    style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
                  >
                    <p className="inline-flex items-center gap-1.5" style={{ color: "#5A6A7A" }}>
                      <StickyNote size={13} />
                      Notes
                    </p>
                    <p className="mt-1 break-words" style={{ color: "#1A1A1A" }}>
                      {selectedBooking.notes}
                    </p>
                  </div>
                ) : null}

                {selectedCustomFieldEntries.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedCustomFieldEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded border px-2 py-1.5 text-xs"
                        style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
                      >
                        <p style={{ color: "#5A6A7A" }}>{formatFieldLabel(key)}</p>
                        <p className="mt-1 break-words" style={{ color: "#1A1A1A" }}>
                          {displayValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm" style={{ color: "#5A6A7A" }}>
                    No intake custom fields captured.
                  </p>
                )}

                {selectedBooking.createdAt ? (
                  <p className="mt-3 text-xs" style={{ color: "#5A6A7A" }}>
                    Created on {formatDateOnly(selectedBooking.createdAt)}
                  </p>
                ) : null}
              </section>

              <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Status Actions
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {transitions[selectedBooking.status].map((targetStatus) => (
                    <button
                      key={`${selectedBooking.id}-${targetStatus}`}
                      type="button"
                      onClick={() => void onUpdateStatus(selectedBooking.id, targetStatus)}
                      disabled={mutatingBookingId === selectedBooking.id}
                      className="rounded border px-3 py-1.5 text-xs transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                    >
                      Mark as {humanize(targetStatus)}
                    </button>
                  ))}
                  {!transitions[selectedBooking.status].length ? (
                    <p className="text-sm" style={{ color: "#5A6A7A" }}>
                      No actions available for this status.
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          ) : (
            <div className="p-4">
              <div
                className="rounded-md border px-4 py-6 text-sm"
                style={{ borderColor: "var(--border)", color: "#5A6A7A" }}
              >
                Select a booking to view full details and update status.
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
