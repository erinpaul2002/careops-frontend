"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { FormRequest, UploadedFormFile } from "@/lib/api/types";
import { getFormFileDownloadUrl } from "@/lib/api/client";
import { isUploadedFile } from "@/components/PublicForm/usePublicForm";
import type { FormsWorkspaceUIProps } from "@/components/FormsWorkspace/types";
import { formatDateOnly, formatDateTime } from "@/lib/format";

function toneFromStatus(status: "pending" | "completed" | "overdue") {
  if (status === "completed") {
    return "success" as const;
  }
  if (status === "overdue") {
    return "danger" as const;
  }
  return "warning" as const;
}

function toneFromBookingStatus(status: string) {
  if (status === "confirmed" || status === "completed") {
    return "success" as const;
  }
  if (status === "cancelled" || status === "no_show") {
    return "danger" as const;
  }
  return "warning" as const;
}

const filters = ["all", "pending", "completed", "overdue"] as const;

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

function renderValue(value: unknown, formRequestId: string): React.ReactNode {
  if (isUploadedFile(value)) {
    return <FileLink file={value} formRequestId={formRequestId} />;
  }
  return <span className="break-words">{displayValue(value)}</span>;
}

function FileLink({ file, formRequestId }: { file: UploadedFormFile; formRequestId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { downloadUrl } = await getFormFileDownloadUrl(formRequestId, file.key);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
      // Could show a toast or error message here
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[#00AA6C] hover:underline disabled:opacity-50"
      style={{ color: "#00AA6C" }}
    >
      {loading ? "Loading..." : file.fileName}
    </button>
  );
}

function formatFieldLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function matchesQuery(request: FormRequest, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const pieces = [
    request.id,
    request.template?.name,
    request.contact?.firstName,
    request.contact?.lastName,
    request.contact?.email,
    request.contact?.phone,
  ];

  return pieces.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function objectEntries(value: unknown): Array<[string, unknown]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value as Record<string, unknown>);
}

export default function FormsWorkspaceUI({
  loading,
  error,
  statusFilter,
  requests,
  onStatusFilterChange,
  onRefresh,
}: FormsWorkspaceUIProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const filteredRequests = useMemo(
    () => requests.filter((request) => matchesQuery(request, searchQuery)),
    [requests, searchQuery],
  );

  const selectedRequest = useMemo(() => {
    if (!filteredRequests.length) {
      return null;
    }
    if (!selectedRequestId) {
      return filteredRequests[0];
    }
    return filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0];
  }, [filteredRequests, selectedRequestId]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.status === "pending").length,
      completed: requests.filter((request) => request.status === "completed").length,
      overdue: requests.filter((request) => request.status === "overdue").length,
    }),
    [requests],
  );

  const selectedSubmissionEntries = objectEntries(selectedRequest?.submission);
  const selectedBookingFieldEntries = objectEntries(selectedRequest?.booking?.customFields);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Data Collection Layer</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Form Requests
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
              placeholder="Search contact or template"
              className="w-44 bg-transparent outline-none sm:w-56"
              style={{ color: "#1A1A1A" }}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              void onStatusFilterChange(
                event.target.value as "all" | "pending" | "completed" | "overdue",
              )
            }
            className="rounded-md border px-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
          >
            {filters.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All statuses" : item}
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            Completed
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#00AA6C" }}>
            {stats.completed}
          </p>
        </article>

        <article className="metric-tile p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5A6A7A" }}>
            Overdue
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#EF4444" }}>
            {stats.overdue}
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
              <ClipboardCheck size={14} style={{ color: "#00AA6C" }} />
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                Requests Queue
              </p>
            </div>
            <p className="text-xs" style={{ color: "#5A6A7A" }}>
              {filteredRequests.length} shown
              {filteredRequests.length !== requests.length ? ` of ${requests.length}` : ""}
            </p>
          </header>

          <div className="max-h-[540px] overflow-y-auto p-3">
            {filteredRequests.length ? (
              <div className="space-y-2">
                {filteredRequests.map((request) => {
                  const selected = request.id === selectedRequest?.id;
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setSelectedRequestId(request.id)}
                      className="w-full rounded-md border p-3 text-left transition-all duration-150"
                      style={{
                        borderColor: selected ? "#00AA6C66" : "var(--border)",
                        background: selected ? "#00AA6C10" : "#ffffff",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium" style={{ color: "#1A1A1A" }}>
                          {request.contact
                            ? `${request.contact.firstName} ${request.contact.lastName}`
                            : "Unknown contact"}
                        </p>
                        <StatusBadge tone={toneFromStatus(request.status)} label={request.status} />
                      </div>

                      <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
                        {request.template?.name ?? "Form Template"}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.08em]" style={{ color: "#5A6A7A" }}>
                        Due {formatDateTime(request.dueAt)}
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
                No form requests found.
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
              Request Detail
            </p>
          </header>

          {selectedRequest ? (
            <div className="space-y-4 p-4">
              <section
                className="rounded-md border p-3"
                style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                    Overview
                  </p>
                  <StatusBadge tone={toneFromStatus(selectedRequest.status)} label={selectedRequest.status} />
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "#5A6A7A" }}>Request ID</dt>
                    <dd className="font-medium" style={{ color: "#1A1A1A" }}>
                      {selectedRequest.id}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "#5A6A7A" }}>Due date</dt>
                    <dd style={{ color: "#1A1A1A" }}>{formatDateTime(selectedRequest.dueAt)}</dd>
                  </div>
                  {selectedRequest.completedAt ? (
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "#5A6A7A" }}>Completed</dt>
                      <dd style={{ color: "#1A1A1A" }}>{formatDateTime(selectedRequest.completedAt)}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Contact
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="inline-flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                    <UserRound size={14} style={{ color: "#00AA6C" }} />
                    {selectedRequest.contact
                      ? `${selectedRequest.contact.firstName} ${selectedRequest.contact.lastName}`
                      : "Unknown contact"}
                  </p>
                  <p className="inline-flex items-center gap-2" style={{ color: "#5A6A7A" }}>
                    <Mail size={14} />
                    {selectedRequest.contact?.email ?? "No email"}
                  </p>
                  <p className="inline-flex items-center gap-2" style={{ color: "#5A6A7A" }}>
                    <Phone size={14} />
                    {selectedRequest.contact?.phone ?? "No phone"}
                  </p>
                </div>
              </section>

              <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Template
                </p>
                <p className="mt-2 text-sm" style={{ color: "#1A1A1A" }}>
                  {selectedRequest.template?.name ?? "Form Template"}
                </p>
                {selectedRequest.template?.fields?.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedRequest.template.fields.slice(0, 4).map((field, index) => {
                      const key = field.key ?? field.name ?? `field-${index}`;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded border px-2 py-1.5 text-xs"
                          style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
                        >
                          <span style={{ color: "#1A1A1A" }}>
                            {field.label ?? field.name ?? formatFieldLabel(key)}
                          </span>
                          <span style={{ color: "#5A6A7A" }}>
                            {(field.type ?? "text").toLowerCase()}
                            {field.required ? " | required" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>

              <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Submission
                </p>
                {selectedSubmissionEntries.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedSubmissionEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded border px-2 py-1.5 text-xs"
                        style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
                      >
                        <p style={{ color: "#5A6A7A" }}>{formatFieldLabel(key)}</p>
                        <div className="mt-1" style={{ color: "#1A1A1A" }}>
                          {renderValue(value, selectedRequest.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm" style={{ color: "#5A6A7A" }}>
                    No submission data captured yet.
                  </p>
                )}
              </section>

              {selectedRequest.booking ? (
                <section className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                    Linked Booking
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "#5A6A7A" }}>Booking ID</dt>
                      <dd style={{ color: "#1A1A1A" }}>{selectedRequest.booking.id}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="inline-flex items-center gap-1.5" style={{ color: "#5A6A7A" }}>
                        <Clock3 size={13} />
                        Starts
                      </dt>
                      <dd style={{ color: "#1A1A1A" }}>{formatDateTime(selectedRequest.booking.startsAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "#5A6A7A" }}>Ends</dt>
                      <dd style={{ color: "#1A1A1A" }}>{formatDateTime(selectedRequest.booking.endsAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "#5A6A7A" }}>Status</dt>
                      <dd>
                        <StatusBadge
                          tone={toneFromBookingStatus(selectedRequest.booking.status)}
                          label={selectedRequest.booking.status.replace("_", " ")}
                        />
                      </dd>
                    </div>
                    {selectedRequest.booking.notes ? (
                      <div>
                        <dt style={{ color: "#5A6A7A" }}>Notes</dt>
                        <dd
                          className="mt-1 rounded border px-2 py-1.5 text-xs"
                          style={{ borderColor: "var(--border)", background: "#FAFBFC", color: "#1A1A1A" }}
                        >
                          {selectedRequest.booking.notes}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {selectedBookingFieldEntries.length ? (
                    <div className="mt-3 space-y-2">
                      {selectedBookingFieldEntries.slice(0, 4).map(([key, value]) => (
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
                  ) : null}

                  {selectedRequest.booking.createdAt ? (
                    <p className="mt-3 text-xs" style={{ color: "#5A6A7A" }}>
                      Booked on {formatDateOnly(selectedRequest.booking.createdAt)}
                    </p>
                  ) : null}
                </section>
              ) : null}
            </div>
          ) : (
            <div className="p-4">
              <div
                className="rounded-md border px-4 py-6 text-sm"
                style={{ borderColor: "var(--border)", color: "#5A6A7A" }}
              >
                Select a form request to view full details.
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
