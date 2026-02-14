"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Copy,
  ChevronRight,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSessionState,
} from "@/lib/session";
import type {
  AvailabilityRule,
  FormTemplate,
  PublicFieldConfig,
  Service,
} from "@/lib/api/types";
import type {
  PublicFormsSetupUIProps,
  PublicSetupModule,
  TemplateFieldDraft,
} from "@/components/PublicFormsSetup/types";

const fieldTypeOptions = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "checkbox",
] as const;
const templateFieldTypeOptions = [...fieldTypeOptions, "file"] as const;

const depthColors = ["#00AA6C", "#FFD500", "#2563EB"] as const;
const weekdayFullLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const exceptionModeOptions = [
  { value: "closed_all_day", label: "Closed all day" },
  { value: "blocked_time", label: "Block time range" },
  { value: "custom_hours", label: "Custom hours" },
] as const;
const moduleOrder: PublicSetupModule[] = [
  "services",
  "templates",
  "trigger",
  "fields",
];

function toFieldKey(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "field";
}

function normalizeFieldKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isCoreRequiredField(field: TemplateFieldDraft): boolean {
  const key = normalizeFieldKey(field.key);
  return key === "name" || key === "email";
}

function mapTemplateFieldToDraft(
  field: FormTemplate["fields"][number],
  index: number,
): TemplateFieldDraft {
  const label = String(field.label ?? field.name ?? "").trim() || `Field ${index + 1}`;
  return {
    id: `baseline-${index}`,
    label,
    key: String(field.key ?? "").trim() || toFieldKey(label),
    type: String(field.type ?? "text").trim() || "text",
    required: Boolean(field.required),
    placeholder: String(field.placeholder ?? ""),
  };
}

function areTemplateDraftFieldsEqual(
  left: TemplateFieldDraft[],
  right: TemplateFieldDraft[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((field, index) => {
    const other = right[index];
    if (!other) {
      return false;
    }
    return (
      field.label === other.label &&
      field.key === other.key &&
      field.type === other.type &&
      field.required === other.required &&
      field.placeholder === other.placeholder
    );
  });
}

function isServiceEditDirty(
  service: Service,
  edit: {
    name: string;
    durationMin: string;
    locationType: "in_person" | "virtual";
  } | undefined,
): boolean {
  if (!edit) {
    return false;
  }
  return (
    edit.name !== service.name ||
    edit.durationMin !== String(service.durationMin) ||
    edit.locationType !== service.locationType
  );
}

function isTemplateEditDirty(
  template: FormTemplate,
  edit: {
    name: string;
    fields: TemplateFieldDraft[];
  },
): boolean {
  const baselineFields = template.fields.map((field, index) =>
    mapTemplateFieldToDraft(field, index),
  );
  return (
    edit.name !== template.name ||
    !areTemplateDraftFieldsEqual(edit.fields, baselineFields)
  );
}

function arePublicFlowFieldsEqual(
  drafts: TemplateFieldDraft[],
  fields: PublicFieldConfig[],
): boolean {
  if (drafts.length !== fields.length) {
    return false;
  }

  return drafts.every((draft, index) => {
    const field = fields[index];
    if (!field) {
      return false;
    }
    return (
      draft.label === (field.label ?? "") &&
      draft.key === (field.key ?? "") &&
      draft.type === (field.type ?? "text") &&
      draft.required === Boolean(field.required) &&
      draft.placeholder === (field.placeholder ?? "")
    );
  });
}

function resolveRuleType(rule: AvailabilityRule): "weekly" | "date_override" | "date_block" {
  if (rule.ruleType === "weekly" || rule.ruleType === "date_override" || rule.ruleType === "date_block") {
    return rule.ruleType;
  }
  return "weekly";
}

function formatExceptionLabel(rule: AvailabilityRule): string {
  const ruleType = resolveRuleType(rule);
  if (ruleType === "date_override") {
    return `Custom hours ${rule.startTime ?? "--:--"} to ${rule.endTime ?? "--:--"}`;
  }
  if (rule.isClosedAllDay) {
    return "Closed all day";
  }
  return `Blocked ${rule.startTime ?? "--:--"} to ${rule.endTime ?? "--:--"}`;
}

export default function PublicFormsSetupUI({
  loading,
  error,
  notice,
  activeModule,
  services,
  availabilityRules,
  weeklyScheduleDraftsByServiceId,
  exceptionDraftsByServiceId,
  templates,
  serviceDraft,
  templateDraft,
  serviceEdits,
  templateEdits,
  mutatingServiceId,
  mutatingAvailabilityRuleId,
  savingWeeklyScheduleServiceId,
  creatingExceptionForServiceId,
  mutatingTemplateId,
  mutatingTriggerServiceId,
  creatingService,
  creatingTemplate,
  publicFlowConfig,
  publicFlowFieldDrafts,
  savingPublicFlowConfig,
  onboardingWarnings,
  onModuleChange,
  moduleNavigation = "enabled",
  onRefresh,
  onServiceDraftChange,
  onCreateService,
  onServiceEditChange,
  onSaveService,
  onDeleteService,
  onToggleService,
  onWeeklyScheduleDraftChange,
  onSaveWeeklySchedule,
  onExceptionDraftChange,
  onCreateException,
  onDeleteAvailabilityRule,
  onTemplateDraftChange,
  onTemplateFieldChange,
  onAddTemplateField,
  onRemoveTemplateField,
  onCreateTemplate,
  onTemplateEditChange,
  onTemplateEditFieldChange,
  onAddTemplateEditField,
  onRemoveTemplateEditField,
  onSaveTemplate,
  onDeleteTemplate,
  onSetServiceTemplate,
  onPublicFlowFieldChange,
  onAddPublicFlowField,
  onRemovePublicFlowField,
  onSavePublicFlowConfig,
}: PublicFormsSetupUIProps) {
  const activeServices = services.filter((service) => service.isActive);
  const hasActiveServices = services.some((service) => service.isActive);
  const hasTemplates = templates.length > 0;
  const triggerConfigured =
    activeServices.length > 0 &&
    activeServices.every((service) => Boolean(service.bookingFormTemplateId));
  const fieldPolicyConfigured =
    publicFlowConfig.booking.fields.length > 0 || publicFlowConfig.contact.fields.length > 0;
  const moduleCards: Array<{
    key: PublicSetupModule;
    title: string;
    detail: string;
    complete: boolean;
  }> = [
    {
      key: "services",
      title: "1. Services",
      detail: "Manage services and slot timings.",
      complete: hasActiveServices,
    },
    {
      key: "templates",
      title: "2. Templates",
      detail: "Create and edit reusable intake forms.",
      complete: hasTemplates,
    },
    {
      key: "trigger",
      title: "3. Trigger",
      detail: "Link post-booking forms by service.",
      complete: triggerConfigured,
    },
    {
      key: "fields",
      title: "4. Public Fields",
      detail: "Control public booking/contact fields.",
      complete: fieldPolicyConfigured,
    },
  ];
  const currentModuleIndex = moduleOrder.indexOf(activeModule);
  const previousModule =
    currentModuleIndex > 0 ? moduleOrder[currentModuleIndex - 1] : null;
  const nextModule =
    currentModuleIndex < moduleOrder.length - 1
      ? moduleOrder[currentModuleIndex + 1]
      : null;
  const [collapsedServiceIds, setCollapsedServiceIds] = useState<Record<string, boolean>>({});
  const [collapsedTemplateIds, setCollapsedTemplateIds] = useState<Record<string, boolean>>({});
  const [editingServiceIds, setEditingServiceIds] = useState<Record<string, boolean>>({});
  const [editingTemplateIds, setEditingTemplateIds] = useState<Record<string, boolean>>({});
  const [editingPublicFieldCategories, setEditingPublicFieldCategories] = useState<
    Record<"booking" | "contact", boolean>
  >({
    booking: false,
    contact: false,
  });
  const [copiedFormCategory, setCopiedFormCategory] = useState<"booking" | "contact" | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const publicBookingFieldsDirty = !arePublicFlowFieldsEqual(
    publicFlowFieldDrafts.booking,
    publicFlowConfig.booking.fields,
  );
  const publicContactFieldsDirty = !arePublicFlowFieldsEqual(
    publicFlowFieldDrafts.contact,
    publicFlowConfig.contact.fields,
  );
  const hasPublicFlowChanges = publicBookingFieldsDirty || publicContactFieldsDirty;
  const isAnyPublicFieldEditing =
    editingPublicFieldCategories.booking || editingPublicFieldCategories.contact;
  const session = useSyncExternalStore(
    subscribeSessionState,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const workspaceId = session.workspaceId?.trim() ?? "";
  const hasWorkspaceId = workspaceId.length > 0;

  const getPublicFormPath = (category: "booking" | "contact"): string | null => {
    if (!hasWorkspaceId) {
      return null;
    }
    return category === "booking"
      ? `/b/${workspaceId}`
      : `/f/${workspaceId}/contact`;
  };

  const onCopyPublicFormLink = async (category: "booking" | "contact") => {
    const path = getPublicFormPath(category);
    if (!path) {
      setCopyError("Public link unavailable. Sign in again to load your workspace ID.");
      return;
    }
    const url =
      typeof window === "undefined" ? path : `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyError(null);
      setCopiedFormCategory(category);
      window.setTimeout(() => {
        setCopiedFormCategory((previous) => (previous === category ? null : previous));
      }, 1500);
    } catch {
      setCopyError("Could not copy link. Copy from the URL text instead.");
    }
  };

  const renderPublicFieldEditor = (category: "booking" | "contact", title: string) => {
    const isEditing = editingPublicFieldCategories[category];
    const isDirty =
      category === "booking" ? publicBookingFieldsDirty : publicContactFieldsDirty;

    return (
      <article className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void onCopyPublicFormLink(category)}
              disabled={!hasWorkspaceId}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
            >
              <Copy size={12} />
              {copiedFormCategory === category ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() =>
                setEditingPublicFieldCategories((previous) => ({
                  ...previous,
                  [category]: !previous[category],
                }))
              }
              className="rounded-md border px-2 py-1.5 text-xs font-medium transition-all duration-200"
              style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
            >
              {isEditing ? "Done" : "Edit"}
            </button>
            {isEditing && isDirty ? (
              <StatusBadge tone="warning" label="Unsaved changes" />
            ) : null}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {publicFlowFieldDrafts[category].map((field, index) => (
            (() => {
              const lockedCoreField = isCoreRequiredField(field);
              return (
            <div
              key={field.id}
              className="grid gap-2 rounded-md border p-3 lg:grid-cols-12"
              style={{ borderColor: "var(--border)", background: "#ffffff" }}
            >
              <input
                value={field.label}
                onChange={(event) =>
                  onPublicFlowFieldChange(category, field.id, "label", event.target.value)
                }
                disabled={!isEditing || savingPublicFlowConfig}
                placeholder={`Field ${index + 1} label`}
                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3 disabled:opacity-60"
                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              />
              <input
                value={field.key}
                onChange={(event) =>
                  onPublicFlowFieldChange(category, field.id, "key", event.target.value)
                }
                disabled={!isEditing || savingPublicFlowConfig || lockedCoreField}
                placeholder="key_name"
                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              />
              <select
                value={field.type}
                onChange={(event) =>
                  onPublicFlowFieldChange(category, field.id, "type", event.target.value)
                }
                disabled={!isEditing || savingPublicFlowConfig || lockedCoreField}
                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              >
                {fieldTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                value={field.placeholder}
                onChange={(event) =>
                  onPublicFlowFieldChange(category, field.id, "placeholder", event.target.value)
                }
                disabled={!isEditing || savingPublicFlowConfig}
                placeholder="Placeholder"
                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3 disabled:opacity-60"
                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              />
              <label
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs lg:col-span-1"
                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
              >
                <input
                  type="checkbox"
                  checked={field.required}
                  disabled={!isEditing || savingPublicFlowConfig || lockedCoreField}
                  onChange={(event) =>
                    onPublicFlowFieldChange(category, field.id, "required", event.target.checked)
                  }
                />
                Req
              </label>
              <button
                type="button"
                onClick={() => onRemovePublicFlowField(category, field.id)}
                disabled={!isEditing || savingPublicFlowConfig || lockedCoreField}
                className="inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs disabled:opacity-60"
                style={{ borderColor: "#EF444440", color: "#991B1B", background: "#FEF2F2" }}
              >
                <Trash2 size={12} />
              </button>
            </div>
              );
            })()
          ))}
          {!publicFlowFieldDrafts[category].length ? (
            <p className="text-xs" style={{ color: "#5A6A7A" }}>
              No fields configured.
            </p>
          ) : null}
        </div>

        {isEditing ? (
          <button
            type="button"
            onClick={() => onAddPublicFlowField(category)}
            disabled={savingPublicFlowConfig}
            className="mt-3 rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60"
            style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          >
            Add field
          </button>
        ) : null}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Public Flow Foundry</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Public Forms Creation Flow
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#5A6A7A" }}>
            Build services, author intake templates, and map post-booking forms per service.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all duration-200"
          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = "#00AA6C";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
            style={{ color: "#00AA6C" }}
          />
          Refresh
        </button>
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
      {notice ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#00AA6C40", background: "#ECFDF5", color: "#065F46" }}
        >
          {notice}
        </div>
      ) : null}
      {onboardingWarnings.length ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}
        >
          <p className="font-semibold">Action required before go-live:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {onboardingWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {moduleNavigation === "enabled" ? (
        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
              Setup Modules
            </p>
            <StatusBadge tone="neutral" label={`Current: ${activeModule}`} />
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-4">
            {moduleCards.map((module) => (
              <button
                key={module.key}
                type="button"
                onClick={() => onModuleChange(module.key)}
                className="rounded-md border px-3 py-3 text-left transition-all duration-200"
                style={
                  activeModule === module.key
                    ? { borderColor: "#00AA6C", background: "#ECFDF5" }
                    : { borderColor: "var(--border)", background: "#ffffff" }
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                    {module.title}
                  </p>
                  <StatusBadge
                    tone={module.complete ? "success" : "warning"}
                    label={module.complete ? "ready" : "pending"}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: "#5A6A7A" }}>
                  {module.detail}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeModule === "services" ? (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: "#00AA6C" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
            Step 1: Service Management
          </h3>
        </div>

        <div className="panel p-4">
          <div className="grid gap-2 md:grid-cols-4">
            <input
              value={serviceDraft.name}
              onChange={(event) => onServiceDraftChange("name", event.target.value)}
              placeholder="Service name"
              className="rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
            />
            <input
              type="number"
              min={1}
              value={serviceDraft.durationMin}
              onChange={(event) => onServiceDraftChange("durationMin", event.target.value)}
              placeholder="Duration (min)"
              className="rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
            />
            <select
              value={serviceDraft.locationType}
              onChange={(event) => onServiceDraftChange("locationType", event.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
            >
              <option value="in_person">In person</option>
              <option value="virtual">Virtual</option>
            </select>
            <button
              type="button"
              onClick={() => void onCreateService()}
              disabled={creatingService}
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{ background: "#00AA6C", color: "#ffffff" }}
            >
              <Plus size={14} />
              {creatingService ? "Creating..." : "Create service"}
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {services.map((service, index) => {
            const edit = serviceEdits[service.id];
            const busy = mutatingServiceId === service.id;
            const isEditingService = editingServiceIds[service.id] ?? false;
            const serviceDirty = isServiceEditDirty(service, edit);
            const collapsed = collapsedServiceIds[service.id] ?? true;
            const serviceRules = availabilityRules.filter((rule) => rule.serviceId === service.id);
            const weeklyRules = serviceRules.filter((rule) => resolveRuleType(rule) === "weekly");
            const exceptionRules = serviceRules
              .filter((rule) => resolveRuleType(rule) !== "weekly")
              .sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));
            const weeklyDraft = weeklyScheduleDraftsByServiceId[service.id] ?? {};
            const exceptionDraft = exceptionDraftsByServiceId[service.id] ?? {
              date: "",
              mode: "closed_all_day",
              startTime: "09:00",
              endTime: "17:00",
              bufferMin: "0",
              slotIntervalMin: "",
            };
            return (
              <article key={service.id} className="panel relative overflow-hidden p-4">
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: depthColors[index % depthColors.length] }}
                />
                <div className="pl-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={service.isActive ? "success" : "neutral"} label={service.isActive ? "active" : "inactive"} />
                      <p className="text-xs font-medium" style={{ color: "#1A1A1A" }}>
                        {service.name}
                      </p>
                      <p className="text-xs" style={{ color: "#5A6A7A" }}>
                        ID: {service.id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedServiceIds((previous) => ({
                          ...previous,
                          [service.id]: !(previous[service.id] ?? true),
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all duration-200"
                      style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                    >
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`}
                      />
                      {collapsed ? "Expand" : "Minimize"}
                    </button>
                  </div>
                  {collapsed ? null : (
                    <div className="space-y-3">
                      <div className="grid gap-2 lg:grid-cols-4">
                        <input
                          value={edit?.name ?? ""}
                          onChange={(event) =>
                            onServiceEditChange(service.id, "name", event.target.value)
                          }
                          disabled={!isEditingService || busy}
                          className="rounded-md border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                        />
                        <input
                          type="number"
                          min={1}
                          value={edit?.durationMin ?? ""}
                          onChange={(event) =>
                            onServiceEditChange(service.id, "durationMin", event.target.value)
                          }
                          disabled={!isEditingService || busy}
                          className="rounded-md border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                        />
                        <select
                          value={edit?.locationType ?? "in_person"}
                          onChange={(event) =>
                            onServiceEditChange(service.id, "locationType", event.target.value)
                          }
                          disabled={!isEditingService || busy}
                          className="rounded-md border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                        >
                          <option value="in_person">In person</option>
                          <option value="virtual">Virtual</option>
                        </select>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingServiceIds((previous) => ({
                                ...previous,
                                [service.id]: !previous[service.id],
                              }))
                            }
                            disabled={busy}
                            className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
                          >
                            {isEditingService ? "Done" : "Edit"}
                          </button>
                          {isEditingService && serviceDirty ? (
                            <button
                              type="button"
                              onClick={() => void onSaveService(service.id)}
                              disabled={busy}
                              className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60"
                              style={{ borderColor: "#2563EB40", color: "#1D4ED8", background: "#EFF6FF" }}
                            >
                              {busy ? "Saving..." : "Save"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void onToggleService(service.id, !service.isActive)}
                            disabled={busy}
                            className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60"
                            style={{ borderColor: "#00AA6C40", color: "#065F46", background: "#ECFDF5" }}
                          >
                            {service.isActive ? "Pause" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteService(service.id)}
                            disabled={busy}
                            className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60"
                            style={{ borderColor: "#EF444440", color: "#991B1B", background: "#FEF2F2" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "#5A6A7A" }}>
                            Weekly Availability
                          </p>
                          {editingServiceIds[service.id] && (
                            <button
                              type="button"
                              onClick={() => void onSaveWeeklySchedule(service.id)}
                              disabled={savingWeeklyScheduleServiceId === service.id}
                              className="rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-60"
                              style={{ borderColor: "#2563EB40", color: "#1D4ED8", background: "#EFF6FF" }}
                            >
                              {savingWeeklyScheduleServiceId === service.id ? "Saving..." : "Save weekly schedule"}
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div
                            className="hidden gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] lg:grid lg:grid-cols-12"
                            style={{ color: "#5A6A7A" }}
                          >
                            <p className="lg:col-span-2">Day</p>
                            <p className="lg:col-span-2">Start</p>
                            <p className="lg:col-span-2">End</p>
                            <p className="lg:col-span-2">Buffer (min)</p>
                            <p className="lg:col-span-2">Interval (min)</p>
                            <p className="lg:col-span-2 text-right">Status</p>
                          </div>
                          {weekdayFullLabels.map((label, weekday) => {
                            const dayDraft = weeklyDraft[weekday] ?? {
                              enabled: false,
                              startTime: "09:00",
                              endTime: "17:00",
                              bufferMin: "0",
                              slotIntervalMin: "",
                            };
                            return (
                              <div
                                key={`${service.id}-${label}`}
                                className="grid gap-2 rounded-md border p-2 lg:grid-cols-12"
                                style={{ borderColor: "var(--border)", background: "#ffffff" }}
                              >
                                <label className="flex items-center gap-2 text-xs font-medium lg:col-span-2" style={{ color: "#1A1A1A" }}>
                                  <input
                                    type="checkbox"
                                    checked={dayDraft.enabled}
                                    onChange={(event) =>
                                      onWeeklyScheduleDraftChange(
                                        service.id,
                                        weekday,
                                        "enabled",
                                        event.target.checked,
                                      )
                                    }
                                    disabled={!editingServiceIds[service.id]}
                                    className="h-4 w-4 rounded accent-[#00AA6C]"
                                  />
                                  {label}
                                </label>
                                <input
                                  type="time"
                                  value={dayDraft.startTime}
                                  onChange={(event) =>
                                    onWeeklyScheduleDraftChange(
                                      service.id,
                                      weekday,
                                      "startTime",
                                      event.target.value,
                                    )
                                  }
                                  disabled={!editingServiceIds[service.id] || !dayDraft.enabled}
                                  className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                                  style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                                />
                                <input
                                  type="time"
                                  value={dayDraft.endTime}
                                  onChange={(event) =>
                                    onWeeklyScheduleDraftChange(
                                      service.id,
                                      weekday,
                                      "endTime",
                                      event.target.value,
                                    )
                                  }
                                  disabled={!editingServiceIds[service.id] || !dayDraft.enabled}
                                  className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                                  style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  value={dayDraft.bufferMin}
                                  onChange={(event) =>
                                    onWeeklyScheduleDraftChange(
                                      service.id,
                                      weekday,
                                      "bufferMin",
                                      event.target.value,
                                    )
                                  }
                                  disabled={!editingServiceIds[service.id] || !dayDraft.enabled}
                                  placeholder="Buffer"
                                  className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                                  style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={dayDraft.slotIntervalMin}
                                  onChange={(event) =>
                                    onWeeklyScheduleDraftChange(
                                      service.id,
                                      weekday,
                                      "slotIntervalMin",
                                      event.target.value,
                                    )
                                  }
                                  disabled={!editingServiceIds[service.id] || !dayDraft.enabled}
                                  placeholder="Interval (opt)"
                                  className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                                  style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                                />
                                <div className="flex items-center justify-end lg:col-span-2">
                                  <p className="text-[11px] font-medium" style={{ color: dayDraft.enabled ? "#065F46" : "#5A6A7A" }}>
                                    {dayDraft.enabled ? "Open" : "Closed"}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[11px]" style={{ color: "#5A6A7A" }}>
                          Slots use service duration plus optional buffer/interval. Disable a day to mark it closed.
                        </p>
                      </div>

                      <div className="space-y-3 rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
                        <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "#5A6A7A" }}>
                          Date Exceptions
                        </p>
                        <div
                          className="hidden gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] lg:grid lg:grid-cols-12"
                          style={{ color: "#5A6A7A" }}
                        >
                          <p className="lg:col-span-2">Date</p>
                          <p className="lg:col-span-3">Mode</p>
                          <p className="lg:col-span-2">Start</p>
                          <p className="lg:col-span-2">End</p>
                          <p className="lg:col-span-1">Buffer</p>
                          <p className="lg:col-span-1">Interval</p>
                          <p className="lg:col-span-1 text-right">Action</p>
                        </div>
                        <div className="grid gap-2 rounded-md border p-2 lg:grid-cols-12" style={{ borderColor: "var(--border)", background: "#ffffff" }}>
                          <input
                            type="date"
                            value={exceptionDraft.date}
                            onChange={(event) =>
                              onExceptionDraftChange(service.id, "date", event.target.value)
                            }
                            disabled={!editingServiceIds[service.id]}
                            className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                          />
                          <select
                            value={exceptionDraft.mode}
                            onChange={(event) =>
                              onExceptionDraftChange(service.id, "mode", event.target.value)
                            }
                            disabled={!editingServiceIds[service.id]}
                            className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                          >
                            {exceptionModeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={exceptionDraft.startTime}
                            onChange={(event) =>
                              onExceptionDraftChange(service.id, "startTime", event.target.value)
                            }
                            disabled={!editingServiceIds[service.id] || exceptionDraft.mode === "closed_all_day"}
                            className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                          />
                          <input
                            type="time"
                            value={exceptionDraft.endTime}
                            onChange={(event) =>
                              onExceptionDraftChange(service.id, "endTime", event.target.value)
                            }
                            disabled={!editingServiceIds[service.id] || exceptionDraft.mode === "closed_all_day"}
                            className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                          />
                          <input
                            type="number"
                            min={0}
                            value={exceptionDraft.bufferMin}
                            onChange={(event) =>
                              onExceptionDraftChange(service.id, "bufferMin", event.target.value)
                            }
                            disabled={!editingServiceIds[service.id] || exceptionDraft.mode !== "custom_hours"}
                            placeholder="Buffer"
                            className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-1 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                          />
                          <input
                            type="number"
                            min={1}
                            value={exceptionDraft.slotIntervalMin}
                            onChange={(event) =>
                              onExceptionDraftChange(service.id, "slotIntervalMin", event.target.value)
                            }
                            disabled={!editingServiceIds[service.id] || exceptionDraft.mode !== "custom_hours"}
                            placeholder="Int"
                            className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-1 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                          />
                          <button
                            type="button"
                            onClick={() => void onCreateException(service.id)}
                            disabled={!editingServiceIds[service.id] || creatingExceptionForServiceId === service.id}
                            className="rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-60 lg:col-span-1"
                            style={{ borderColor: "#00AA6C40", color: "#065F46", background: "#ECFDF5" }}
                          >
                            {creatingExceptionForServiceId === service.id ? "Adding..." : "Add"}
                          </button>
                        </div>

                        {exceptionRules.length ? (
                          <div className="space-y-2">
                            {exceptionRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
                                style={{ borderColor: "var(--border)", background: "#ffffff" }}
                              >
                                <div className="text-xs">
                                  <p style={{ color: "#1A1A1A", fontWeight: 600 }}>
                                    {rule.date ?? "No date"}
                                  </p>
                                  <p style={{ color: "#5A6A7A" }}>
                                    {formatExceptionLabel(rule)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void onDeleteAvailabilityRule(rule.id)}
                                  disabled={!editingServiceIds[service.id] || mutatingAvailabilityRuleId === rule.id}
                                  className="rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-60"
                                  style={{ borderColor: "#EF444440", color: "#991B1B", background: "#FEF2F2" }}
                                >
                                  {mutatingAvailabilityRuleId === rule.id ? "Removing..." : "Delete"}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: "#5A6A7A" }}>
                            No exceptions yet.
                          </p>
                        )}

                        {!weeklyRules.length ? (
                          <p className="text-[11px]" style={{ color: "#5A6A7A" }}>
                            This service currently has no weekly open days configured.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {!services.length ? (
            <p className="text-sm" style={{ color: "#5A6A7A" }}>
              No services yet.
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {activeModule === "templates" ? (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ChevronRight size={16} style={{ color: "#FFD500" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
            Step 2: Form Template Management
          </h3>
        </div>

        <div className="panel p-4">
          <p className="mb-2 text-sm font-medium" style={{ color: "#1A1A1A" }}>
            Create Template
          </p>
          <div className="space-y-2">
            <input
              value={templateDraft.name}
              onChange={(event) => onTemplateDraftChange("name", event.target.value)}
              placeholder="Template name"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
            />

            <div className="space-y-2">
              {templateDraft.fields.map((field, index) => (
                (() => {
                  const lockedCoreField = isCoreRequiredField(field);
                  return (
                <div
                  key={field.id}
                  className="grid gap-2 rounded-md border p-3 lg:grid-cols-12"
                  style={{ borderColor: "var(--border)", background: "#FAFBFC" }}
                >
                  <input
                    value={field.label}
                    onChange={(event) =>
                      onTemplateFieldChange(field.id, "label", event.target.value)
                    }
                    placeholder={`Field ${index + 1} label`}
                    className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3"
                    style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                  />
                  <input
                    value={field.key}
                    onChange={(event) =>
                      onTemplateFieldChange(field.id, "key", event.target.value)
                    }
                    disabled={lockedCoreField}
                    placeholder="key_name"
                    className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2"
                    style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                  />
                  <select
                    value={field.type}
                    onChange={(event) =>
                      onTemplateFieldChange(field.id, "type", event.target.value)
                    }
                    disabled={lockedCoreField}
                    className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2"
                    style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                  >
                    {templateFieldTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    value={field.placeholder}
                    onChange={(event) =>
                      onTemplateFieldChange(field.id, "placeholder", event.target.value)
                    }
                    placeholder="Placeholder"
                    className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3"
                    style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                  />
                  <label
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs lg:col-span-1"
                    style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                  >
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={lockedCoreField}
                      onChange={(event) =>
                        onTemplateFieldChange(field.id, "required", event.target.checked)
                      }
                    />
                    Req
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveTemplateField(field.id)}
                    disabled={lockedCoreField}
                    className="inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs"
                    style={{ borderColor: "#EF444440", color: "#991B1B", background: "#FEF2F2" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                  );
                })()
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAddTemplateField}
                className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200"
                style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
              >
                Add field
              </button>
              <button
                type="button"
                onClick={() => void onCreateTemplate()}
                disabled={creatingTemplate}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-60"
                style={{ background: "#2563EB", color: "#ffffff" }}
              >
                <Plus size={12} />
                {creatingTemplate ? "Creating..." : "Create template"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {templates.map((template, index) => {
            const busy = mutatingTemplateId === template.id;
            const edit = templateEdits[template.id] ?? { name: template.name, fields: [] };
            const isEditingTemplate = editingTemplateIds[template.id] ?? false;
            const templateDirty = isTemplateEditDirty(template, edit);
            const collapsed = collapsedTemplateIds[template.id] ?? true;
            const templateSummaryFields = isEditingTemplate
              ? edit.fields
              : template.fields.map((field, fieldIndex) =>
                  mapTemplateFieldToDraft(field, fieldIndex),
                );
            return (
              <article key={template.id} className="panel relative overflow-hidden p-4">
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: depthColors[index % depthColors.length] }}
                />
                <div className="pl-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral" label="template" />
                      <p className="text-xs font-medium" style={{ color: "#1A1A1A" }}>
                        {template.name}
                      </p>
                      <p className="text-xs" style={{ color: "#5A6A7A" }}>
                        ID: {template.id}
                      </p>
                    </div>
                    <StatusBadge tone="warning" label={`${templateSummaryFields.length} fields`} />
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedTemplateIds((previous) => ({
                          ...previous,
                          [template.id]: !(previous[template.id] ?? true),
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all duration-200"
                      style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                    >
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`}
                      />
                      {collapsed ? "Expand" : "Minimize"}
                    </button>
                  </div>
                  {collapsed ? (
                    <p className="text-xs" style={{ color: "#5A6A7A" }}>
                      {templateSummaryFields.length
                        ? `Fields: ${templateSummaryFields
                            .slice(0, 3)
                            .map((field) => field.label || field.key || "Field")
                            .join(", ")}${templateSummaryFields.length > 3 ? "..." : ""}`
                        : "No fields configured."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <input
                        value={edit.name}
                        onChange={(event) => onTemplateEditChange(template.id, "name", event.target.value)}
                        disabled={!isEditingTemplate || busy}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-60"
                        style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                      />

                      <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "#FAFBFC" }}>
                        <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "#5A6A7A" }}>
                          Template Fields
                        </p>
                        <div className="mt-2 space-y-2">
                          {edit.fields.map((field, fieldIndex) => (
                            (() => {
                              const lockedCoreField = isCoreRequiredField(field);
                              return (
                            <div
                              key={field.id}
                              className="grid gap-2 rounded-md border p-2 lg:grid-cols-12"
                              style={{ borderColor: "var(--border)", background: "#ffffff" }}
                            >
                              <input
                                value={field.label}
                                onChange={(event) =>
                                  onTemplateEditFieldChange(template.id, field.id, "label", event.target.value)
                                }
                                disabled={!isEditingTemplate || busy}
                                placeholder={`Field ${fieldIndex + 1} label`}
                                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3 disabled:opacity-60"
                                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                              />
                              <input
                                value={field.key}
                                onChange={(event) =>
                                  onTemplateEditFieldChange(template.id, field.id, "key", event.target.value)
                                }
                                disabled={!isEditingTemplate || busy || lockedCoreField}
                                placeholder="key_name"
                                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                              />
                              <select
                                value={field.type}
                                onChange={(event) =>
                                  onTemplateEditFieldChange(template.id, field.id, "type", event.target.value)
                                }
                                disabled={!isEditingTemplate || busy || lockedCoreField}
                                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-2 disabled:opacity-60"
                                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                              >
                                {templateFieldTypeOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={field.placeholder}
                                onChange={(event) =>
                                  onTemplateEditFieldChange(template.id, field.id, "placeholder", event.target.value)
                                }
                                disabled={!isEditingTemplate || busy}
                                placeholder="Placeholder"
                                className="rounded-md border px-2 py-1.5 text-xs outline-none lg:col-span-3 disabled:opacity-60"
                                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                              />
                              <label
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs lg:col-span-1"
                                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  disabled={!isEditingTemplate || busy || lockedCoreField}
                                  onChange={(event) =>
                                    onTemplateEditFieldChange(template.id, field.id, "required", event.target.checked)
                                  }
                                />
                                Req
                              </label>
                              <button
                                type="button"
                                onClick={() => onRemoveTemplateEditField(template.id, field.id)}
                                disabled={!isEditingTemplate || busy || lockedCoreField}
                                className="inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs disabled:opacity-60"
                                style={{ borderColor: "#EF444440", color: "#991B1B", background: "#FEF2F2" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                              );
                            })()
                          ))}
                          {!edit.fields.length ? (
                            <p className="text-xs" style={{ color: "#5A6A7A" }}>
                              No fields configured.
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingTemplateIds((previous) => ({
                              ...previous,
                              [template.id]: !previous[template.id],
                            }))
                          }
                          disabled={busy}
                          className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200"
                          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
                        >
                          {isEditingTemplate ? "Done" : "Edit"}
                        </button>
                        {isEditingTemplate ? (
                          <button
                            type="button"
                            onClick={() => onAddTemplateEditField(template.id)}
                            disabled={busy}
                            className="rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60"
                            style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
                          >
                            Add field
                          </button>
                        ) : null}
                        {isEditingTemplate && templateDirty ? (
                          <button
                            type="button"
                            onClick={() => void onSaveTemplate(template.id)}
                            disabled={busy}
                            className="rounded-md border px-3 py-2 text-xs font-medium disabled:opacity-60"
                            style={{ borderColor: "#2563EB40", color: "#1D4ED8", background: "#EFF6FF" }}
                          >
                            {busy ? "Saving..." : "Save template"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void onDeleteTemplate(template.id)}
                          disabled={busy}
                          className="rounded-md border px-3 py-2 text-xs font-medium disabled:opacity-60"
                          style={{ borderColor: "#EF444440", color: "#991B1B", background: "#FEF2F2" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {!templates.length ? (
            <p className="text-sm" style={{ color: "#5A6A7A" }}>
              No templates yet.
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {activeModule === "trigger" ? (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 size={16} style={{ color: "#2563EB" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
            Step 3: Trigger Configuration
          </h3>
        </div>

        <div className="panel p-4">
          <p className="text-sm" style={{ color: "#5A6A7A" }}>
            Link each service to a template used for post-booking form requests.
          </p>

          <div className="mt-3 space-y-2">
            {services.map((service) => {
              const selectedTemplateId = service.bookingFormTemplateId ?? "";
              const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
              const busy = mutatingTriggerServiceId === service.id;
              return (
                <article
                  key={service.id}
                  className="rounded-md border p-3"
                  style={{ borderColor: "var(--border)", background: "#ffffff" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                        {service.name}
                      </p>
                      <p className="text-xs" style={{ color: "#5A6A7A" }}>
                        {service.durationMin} min - {service.locationType === "in_person" ? "In person" : "Virtual"}
                      </p>
                    </div>
                    <StatusBadge
                      tone={service.isActive ? "success" : "neutral"}
                      label={service.isActive ? "active" : "inactive"}
                    />
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-5">
                    <select
                      value={selectedTemplateId}
                      disabled={busy || !templates.length}
                      onChange={(event) =>
                        void onSetServiceTemplate(
                          service.id,
                          event.target.value ? event.target.value : null,
                        )
                      }
                      className="rounded-md border px-3 py-2 text-sm outline-none transition-colors md:col-span-3"
                      style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                    >
                      <option value="">No automatic form</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.fields.length} fields)
                        </option>
                      ))}
                    </select>
                    <div
                      className="rounded-md border px-3 py-2 text-xs md:col-span-2"
                      style={{ borderColor: "var(--border)", background: "#FAFBFC", color: "#5A6A7A" }}
                    >
                      {busy
                        ? "Saving trigger..."
                        : selectedTemplate
                          ? `Linked: ${selectedTemplate.name}`
                          : "No form will be sent after booking."}
                    </div>
                  </div>
                </article>
              );
            })}
            {!services.length ? (
              <p className="text-sm" style={{ color: "#5A6A7A" }}>
                Add a service before configuring triggers.
              </p>
            ) : null}
            {services.length > 0 && !templates.length ? (
              <p className="text-sm" style={{ color: "#5A6A7A" }}>
                Create at least one template to link forms to services.
              </p>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}

      {activeModule === "fields" ? (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 size={16} style={{ color: "#00AA6C" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
            Step 4: Public Form Fields
          </h3>
        </div>

        <div className="panel p-4 space-y-4">
          <p className="text-sm" style={{ color: "#5A6A7A" }}>
            Only fields created here will be shown and accepted for public booking/contact submissions.
          </p>
          {copyError ? (
            <p className="text-xs" style={{ color: "#92400E" }}>
              {copyError}
            </p>
          ) : null}

          <div className="space-y-4">
            {renderPublicFieldEditor("booking", "Booking Form")}
            {renderPublicFieldEditor("contact", "Contact Form")}
          </div>

          <div className="flex justify-end">
            {isAnyPublicFieldEditing && hasPublicFlowChanges ? (
              <button
                type="button"
                onClick={() => void onSavePublicFlowConfig()}
                disabled={savingPublicFlowConfig}
                className="rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                style={{ background: "#00AA6C", color: "#ffffff" }}
              >
                {savingPublicFlowConfig ? "Saving..." : "Save public fields"}
              </button>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}

      {moduleNavigation === "enabled" ? (
        <section className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={() => previousModule && onModuleChange(previousModule)}
            disabled={!previousModule}
            className="rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          >
            Previous Module
          </button>
          <button
            type="button"
            onClick={() => nextModule && onModuleChange(nextModule)}
            disabled={!nextModule}
            className="rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: "#00AA6C", color: "#ffffff" }}
          >
            Next Module
          </button>
        </section>
      ) : null}
    </div>
  );
}

