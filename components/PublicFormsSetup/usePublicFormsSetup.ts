"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAvailabilityRule,
  createFormTemplate,
  createService,
  deleteAvailabilityRule,
  deleteService,
  deleteFormTemplate,
  getAvailabilityRules,
  getFormTemplates,
  getServices,
  getWorkspacePublicFlowConfig,
  getWorkspaceReadiness,
  patchAvailabilityRule,
  patchFormTemplate,
  patchService,
  patchWorkspacePublicFlowConfig,
} from "@/lib/api/client";
import { mockFormTemplates, mockServices } from "@/lib/api/mockData";
import type {
  AvailabilityRule,
  FormTemplate,
  PublicFieldConfig,
  PublicFlowConfig,
} from "@/lib/api/types";
import type {
  AvailabilityExceptionDraft,
  AvailabilityRuleDraft,
  PublicFormsSetupState,
  TemplateFieldDraft,
  WeeklyScheduleDraft,
} from "@/components/PublicFormsSetup/types";

function createFieldId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toFieldKey(label: string) {
  const normalized = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "field";
}

function createEmptyFieldDraft(): TemplateFieldDraft {
  return {
    id: createFieldId(),
    label: "",
    key: "",
    type: "text",
    required: false,
    placeholder: "",
  };
}

const requiredCoreFieldDefaults = [
  { key: "name", label: "Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
] as const;

function normalizeFieldKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function enforceRequiredCoreDraftFields(drafts: TemplateFieldDraft[]): TemplateFieldDraft[] {
  const normalized = [...drafts];
  const byKey = new Map<string, number>();
  normalized.forEach((field, index) => {
    const key = normalizeFieldKey(field.key);
    if (key) {
      byKey.set(key, index);
    }
  });

  for (const requiredField of requiredCoreFieldDefaults) {
    const index = byKey.get(requiredField.key);
    if (index === undefined) {
      normalized.push({
        id: createFieldId(),
        key: requiredField.key,
        label: requiredField.label,
        type: requiredField.type,
        required: true,
        placeholder: "",
      });
      continue;
    }

    const current = normalized[index];
    normalized[index] = {
      ...current,
      key: requiredField.key,
      label: current.label.trim() || requiredField.label,
      type: requiredField.key === "email" ? "email" : current.type || requiredField.type,
      required: true,
    };
  }

  return normalized;
}

function isRequiredCoreFieldDraft(field: TemplateFieldDraft): boolean {
  const key = normalizeFieldKey(field.key);
  return key === "name" || key === "email";
}

function mapPublicFlowFieldsToDrafts(fields: PublicFieldConfig[]): TemplateFieldDraft[] {
  return enforceRequiredCoreDraftFields(fields.map((field) => ({
    id: createFieldId(),
    label: field.label ?? "",
    key: field.key ?? "",
    type: field.type ?? "text",
    required: Boolean(field.required),
    placeholder: field.placeholder ?? "",
  })));
}

function mapDraftsToPublicFlowFields(drafts: TemplateFieldDraft[]): PublicFieldConfig[] {
  const source = enforceRequiredCoreDraftFields(drafts);
  const seen = new Set<string>();
  const mapped: PublicFieldConfig[] = [];

  source.forEach((draft, index) => {
    const label = draft.label.trim();
    const key = (draft.key.trim() || toFieldKey(label)).trim() || `field_${index + 1}`;
    if (!label || seen.has(key)) {
      return;
    }

    seen.add(key);
    mapped.push({
      key,
      label,
      type: (draft.type || "text").trim() || "text",
      required: Boolean(draft.required),
      placeholder: draft.placeholder.trim() || undefined,
    });
  });

  return mapped;
}

function mapServiceEdits(
  services: PublicFormsSetupState["services"],
): PublicFormsSetupState["serviceEdits"] {
  return Object.fromEntries(
    services.map((service) => [
      service.id,
      {
        name: service.name,
        durationMin: String(service.durationMin),
        locationType: service.locationType,
      },
    ]),
  );
}

function mapTemplateFieldsToDrafts(fields: FormTemplate["fields"]): TemplateFieldDraft[] {
  return enforceRequiredCoreDraftFields(fields.map((field, index) => {
    const label = String(field.label ?? field.name ?? "").trim() || `Field ${index + 1}`;
    return {
      id: createFieldId(),
      label,
      key: String(field.key ?? "").trim() || toFieldKey(label),
      type: String(field.type ?? "text").trim() || "text",
      required: Boolean(field.required),
      placeholder: String(field.placeholder ?? ""),
    };
  }));
}

function mapDraftsToTemplateFields(drafts: TemplateFieldDraft[]): Array<Record<string, unknown>> {
  const source = enforceRequiredCoreDraftFields(drafts);
  const seen = new Set<string>();
  const mapped: Array<Record<string, unknown>> = [];

  source.forEach((draft, index) => {
    const rawLabel = draft.label.trim();
    const label = rawLabel || `Field ${index + 1}`;
    const key = (draft.key.trim() || toFieldKey(label)).trim() || `field_${index + 1}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    mapped.push({
      key,
      label,
      type: (draft.type || "text").trim() || "text",
      required: Boolean(draft.required),
      placeholder: draft.placeholder.trim() || undefined,
    });
  });

  return mapped;
}

function mapTemplateEdits(
  templates: PublicFormsSetupState["templates"],
): PublicFormsSetupState["templateEdits"] {
  return Object.fromEntries(
    templates.map((template) => [
      template.id,
      {
        name: template.name,
        fields: mapTemplateFieldsToDrafts(template.fields),
      },
    ]),
  );
}

function resolveTemplateEdit(
  state: PublicFormsSetupState,
  templateId: string,
): { name: string; fields: TemplateFieldDraft[] } {
  const existing = state.templateEdits[templateId];
  if (existing) {
    return existing;
  }
  const template = state.templates.find((item) => item.id === templateId);
  if (template) {
    return {
      name: template.name,
      fields: mapTemplateFieldsToDrafts(template.fields),
    };
  }
  return {
    name: "",
    fields: enforceRequiredCoreDraftFields([createEmptyFieldDraft()]),
  };
}

function createDefaultAvailabilityRuleDraft(): AvailabilityRuleDraft {
  return {
    weekday: "1",
    startTime: "09:00",
    endTime: "17:00",
    bufferMin: "0",
    slotIntervalMin: "",
  };
}

function createDefaultWeeklyScheduleDraft(): WeeklyScheduleDraft {
  return {
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
    bufferMin: "0",
    slotIntervalMin: "",
  };
}

function createDefaultExceptionDraft(): AvailabilityExceptionDraft {
  return {
    date: "",
    mode: "closed_all_day",
    startTime: "09:00",
    endTime: "17:00",
    bufferMin: "0",
    slotIntervalMin: "",
  };
}

function normalizeAvailabilityRule(rule: AvailabilityRule): AvailabilityRule {
  const normalizedType =
    rule.ruleType === "weekly" ||
    rule.ruleType === "date_override" ||
    rule.ruleType === "date_block"
      ? rule.ruleType
      : "weekly";
  return {
    ...rule,
    ruleType: normalizedType,
    bufferMin: typeof rule.bufferMin === "number" ? rule.bufferMin : 0,
    isClosedAllDay: normalizedType === "date_block" ? Boolean(rule.isClosedAllDay) : false,
  };
}

function mapWeeklyScheduleDraftsByServiceId(
  services: PublicFormsSetupState["services"],
  rules: PublicFormsSetupState["availabilityRules"],
): PublicFormsSetupState["weeklyScheduleDraftsByServiceId"] {
  const mapped: PublicFormsSetupState["weeklyScheduleDraftsByServiceId"] = {};

  services.forEach((service) => {
    const dayMap: Record<number, WeeklyScheduleDraft> = {};
    for (let weekday = 0; weekday < 7; weekday += 1) {
      dayMap[weekday] = createDefaultWeeklyScheduleDraft();
    }

    const weeklyRules = rules
      .filter((rule) => rule.serviceId === service.id && rule.ruleType === "weekly")
      .sort((left, right) => (left.startTime ?? "").localeCompare(right.startTime ?? ""));

    weeklyRules.forEach((rule) => {
      if (!Number.isInteger(rule.weekday) || rule.weekday === undefined) {
        return;
      }
      const weekday = Number(rule.weekday);
      const current = dayMap[weekday];
      if (!current || current.enabled) {
        return;
      }
      dayMap[weekday] = {
        enabled: true,
        startTime: rule.startTime ?? "09:00",
        endTime: rule.endTime ?? "17:00",
        bufferMin: String(typeof rule.bufferMin === "number" ? rule.bufferMin : 0),
        slotIntervalMin:
          typeof rule.slotIntervalMin === "number" ? String(rule.slotIntervalMin) : "",
      };
    });

    mapped[service.id] = dayMap;
  });

  return mapped;
}

function mapExceptionDraftsByServiceId(
  services: PublicFormsSetupState["services"],
): PublicFormsSetupState["exceptionDraftsByServiceId"] {
  return Object.fromEntries(
    services.map((service) => [service.id, createDefaultExceptionDraft()]),
  );
}

function mapAvailabilityRuleEdits(
  rules: PublicFormsSetupState["availabilityRules"],
): PublicFormsSetupState["availabilityRuleEdits"] {
  return Object.fromEntries(
    rules.map((rawRule) => {
      const rule = normalizeAvailabilityRule(rawRule);
      return [
      rule.id,
      {
        weekday: String(rule.weekday ?? 1),
        startTime: rule.startTime ?? "09:00",
        endTime: rule.endTime ?? "17:00",
        bufferMin: String(typeof rule.bufferMin === "number" ? rule.bufferMin : 0),
        slotIntervalMin:
          typeof rule.slotIntervalMin === "number" ? String(rule.slotIntervalMin) : "",
      },
    ];
    }),
  );
}

function mapAvailabilityRuleDraftsByServiceId(
  services: PublicFormsSetupState["services"],
): PublicFormsSetupState["availabilityRuleDraftsByServiceId"] {
  return Object.fromEntries(
    services.map((service) => [service.id, createDefaultAvailabilityRuleDraft()]),
  );
}

function parseWeekday(value: string): number | null {
  const weekday = Number(value);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return null;
  }
  return weekday;
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

const defaultPublicFlowConfig: PublicFlowConfig = {
  booking: { fields: [] },
  contact: { fields: [] },
};

const initialState: PublicFormsSetupState = {
  loading: true,
  error: null,
  notice: null,
  services: [],
  availabilityRules: [],
  weeklyScheduleDraftsByServiceId: {},
  exceptionDraftsByServiceId: {},
  availabilityRuleEdits: {},
  availabilityRuleDraftsByServiceId: {},
  templates: [],
  serviceDraft: {
    name: "",
    durationMin: "30",
    locationType: "in_person",
  },
  templateDraft: {
    name: "",
    fields: enforceRequiredCoreDraftFields([createEmptyFieldDraft()]),
  },
  serviceEdits: {},
  templateEdits: {},
  mutatingServiceId: null,
  mutatingAvailabilityRuleId: null,
  creatingAvailabilityForServiceId: null,
  savingWeeklyScheduleServiceId: null,
  creatingExceptionForServiceId: null,
  mutatingTemplateId: null,
  mutatingTriggerServiceId: null,
  creatingService: false,
  creatingTemplate: false,
  publicFlowConfig: defaultPublicFlowConfig,
  publicFlowFieldDrafts: {
    booking: [],
    contact: [],
  },
  savingPublicFlowConfig: false,
  onboardingWarnings: [],
};

export function usePublicFormsSetup() {
  const [state, setState] = useState<PublicFormsSetupState>(initialState);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState((previous) => ({ ...previous, loading: true, error: null, notice: null }));
    }

    try {
      const [services, availabilityRules, templates, publicFlowConfig, readiness] = await Promise.all([
        getServices(true),
        getAvailabilityRules(),
        getFormTemplates(true),
        getWorkspacePublicFlowConfig(),
        getWorkspaceReadiness(),
      ]);
      const normalizedRules = availabilityRules.map((rule) => normalizeAvailabilityRule(rule));

      setState((previous) => ({
        ...previous,
        loading: false,
        error: null,
        services,
        availabilityRules: normalizedRules,
        weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
          services,
          normalizedRules,
        ),
        exceptionDraftsByServiceId: mapExceptionDraftsByServiceId(services),
        availabilityRuleEdits: mapAvailabilityRuleEdits(normalizedRules),
        availabilityRuleDraftsByServiceId: mapAvailabilityRuleDraftsByServiceId(services),
        templates,
        serviceEdits: mapServiceEdits(services),
        templateEdits: mapTemplateEdits(templates),
        publicFlowConfig,
        publicFlowFieldDrafts: {
          booking: mapPublicFlowFieldsToDrafts(publicFlowConfig.booking.fields),
          contact: mapPublicFlowFieldsToDrafts(publicFlowConfig.contact.fields),
        },
        onboardingWarnings: readiness.warnings,
      }));
    } catch {
      const fallbackTemplates = mockFormTemplates.map((template) => ({
        ...template,
        fields: [...template.fields],
      })) as FormTemplate[];

      setState((previous) => ({
        ...previous,
        loading: false,
        error: "Showing fallback setup preview. API access is unavailable.",
        services: [...mockServices],
        availabilityRules: [],
        weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(mockServices, []),
        exceptionDraftsByServiceId: mapExceptionDraftsByServiceId(mockServices),
        availabilityRuleEdits: {},
        availabilityRuleDraftsByServiceId: mapAvailabilityRuleDraftsByServiceId(mockServices),
        templates: fallbackTemplates,
        serviceEdits: mapServiceEdits(mockServices),
        templateEdits: mapTemplateEdits(fallbackTemplates),
        publicFlowConfig: defaultPublicFlowConfig,
        publicFlowFieldDrafts: {
          booking: [],
          contact: [],
        },
        onboardingWarnings: [
          "Live workspace diagnostics unavailable while using fallback preview data.",
        ],
      }));
    }
  }, []);

  useEffect(() => {
    const kickoff = window.setTimeout(() => {
      void load(false);
    }, 0);
    return () => window.clearTimeout(kickoff);
  }, [load]);

  const onServiceDraftChange = useCallback(
    (field: "name" | "durationMin" | "locationType", value: string) => {
      setState((previous) => ({
        ...previous,
        serviceDraft: {
          ...previous.serviceDraft,
          [field]: value,
        },
      }));
    },
    [],
  );

  const onCreateService = useCallback(async () => {
    const name = state.serviceDraft.name.trim();
    const durationMin = Number(state.serviceDraft.durationMin);
    if (!name || !Number.isFinite(durationMin) || durationMin <= 0) {
      setState((previous) => ({
        ...previous,
        error: "Service name and a valid duration are required.",
        notice: null,
      }));
      return;
    }

    setState((previous) => ({ ...previous, creatingService: true, error: null, notice: null }));
    try {
      const created = await createService({
        name,
        durationMin,
        locationType: state.serviceDraft.locationType,
        inventoryRules: [],
      });

      setState((previous) => {
        const services = [...previous.services, created];
        const availabilityRules = [...previous.availabilityRules];
        return {
          ...previous,
          creatingService: false,
          services,
          weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
            services,
            availabilityRules,
          ),
          exceptionDraftsByServiceId: mapExceptionDraftsByServiceId(services),
          availabilityRuleDraftsByServiceId: {
            ...previous.availabilityRuleDraftsByServiceId,
            [created.id]: createDefaultAvailabilityRuleDraft(),
          },
          serviceEdits: mapServiceEdits(services),
          serviceDraft: {
            name: "",
            durationMin: "30",
            locationType: previous.serviceDraft.locationType,
          },
          notice: "Service created.",
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        creatingService: false,
        error: messageFromError(error, "Could not create service."),
      }));
    }
  }, [state.serviceDraft]);

  const onServiceEditChange = useCallback(
    (
      serviceId: string,
      field: "name" | "durationMin" | "locationType",
      value: string,
    ) => {
      setState((previous) => ({
        ...previous,
        serviceEdits: {
          ...previous.serviceEdits,
          [serviceId]: {
            ...previous.serviceEdits[serviceId],
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const onSaveService = useCallback(
    async (serviceId: string) => {
      const draft = state.serviceEdits[serviceId];
      if (!draft) {
        return;
      }
      const name = draft.name.trim();
      const durationMin = Number(draft.durationMin);
      if (!name || !Number.isFinite(durationMin) || durationMin <= 0) {
        setState((previous) => ({
          ...previous,
          error: "Service name and a valid duration are required.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({ ...previous, mutatingServiceId: serviceId, error: null, notice: null }));
      try {
        const updated = await patchService(serviceId, {
          name,
          durationMin,
          locationType: draft.locationType,
        });
        setState((previous) => {
          const services = previous.services.map((item) => (item.id === serviceId ? updated : item));
          return {
            ...previous,
            mutatingServiceId: null,
            services,
            serviceEdits: mapServiceEdits(services),
            notice: "Service updated.",
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingServiceId: null,
          error: messageFromError(error, "Could not update service."),
        }));
      }
    },
    [state.serviceEdits],
  );

  const onToggleService = useCallback(async (serviceId: string, isActive: boolean) => {
    setState((previous) => ({ ...previous, mutatingServiceId: serviceId, error: null, notice: null }));
    try {
      const updated = await patchService(serviceId, { isActive });
      setState((previous) => {
        const services = previous.services.map((item) => (item.id === serviceId ? updated : item));
        return {
          ...previous,
          mutatingServiceId: null,
          services,
          serviceEdits: mapServiceEdits(services),
          notice: `Service ${isActive ? "activated" : "paused"}.`,
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        mutatingServiceId: null,
        error: messageFromError(error, "Could not update service status."),
      }));
    }
  }, []);

  const onDeleteService = useCallback(async (serviceId: string) => {
    setState((previous) => ({ ...previous, mutatingServiceId: serviceId, error: null, notice: null }));
    try {
      await deleteService(serviceId);
      setState((previous) => {
        const services = previous.services.filter((item) => item.id !== serviceId);
        const availabilityRules = previous.availabilityRules.filter((rule) => rule.serviceId !== serviceId);
        const availabilityRuleEdits = { ...previous.availabilityRuleEdits };
        previous.availabilityRules
          .filter((rule) => rule.serviceId === serviceId)
          .forEach((rule) => {
            delete availabilityRuleEdits[rule.id];
          });
        const availabilityRuleDraftsByServiceId = { ...previous.availabilityRuleDraftsByServiceId };
        delete availabilityRuleDraftsByServiceId[serviceId];
        return {
          ...previous,
          mutatingServiceId: null,
          services,
          availabilityRules,
          weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
            services,
            availabilityRules,
          ),
          exceptionDraftsByServiceId: mapExceptionDraftsByServiceId(services),
          availabilityRuleEdits,
          availabilityRuleDraftsByServiceId,
          serviceEdits: mapServiceEdits(services),
          notice: "Service deleted.",
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        mutatingServiceId: null,
        error: messageFromError(error, "Could not delete service."),
      }));
    }
  }, []);

  const onWeeklyScheduleDraftChange = useCallback(
    (
      serviceId: string,
      weekday: number,
      field: "enabled" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
      value: string | boolean,
    ) => {
      setState((previous) => ({
        ...previous,
        weeklyScheduleDraftsByServiceId: {
          ...previous.weeklyScheduleDraftsByServiceId,
          [serviceId]: {
            ...(previous.weeklyScheduleDraftsByServiceId[serviceId] ?? {}),
            [weekday]: {
              ...(previous.weeklyScheduleDraftsByServiceId[serviceId]?.[weekday] ??
                createDefaultWeeklyScheduleDraft()),
              [field]: value,
            },
          },
        },
      }));
    },
    [],
  );

  const onSaveWeeklySchedule = useCallback(
    async (serviceId: string) => {
      const schedule = state.weeklyScheduleDraftsByServiceId[serviceId];
      if (!schedule) {
        return;
      }

      for (let weekday = 0; weekday < 7; weekday += 1) {
        const dayDraft = schedule[weekday] ?? createDefaultWeeklyScheduleDraft();
        if (!dayDraft.enabled) {
          continue;
        }
        const startTime = dayDraft.startTime.trim();
        const endTime = dayDraft.endTime.trim();
        const bufferMin = Number(dayDraft.bufferMin);
        const slotIntervalRaw = dayDraft.slotIntervalMin.trim();
        const slotIntervalMin =
          slotIntervalRaw.length > 0 ? Number(slotIntervalRaw) : undefined;

        if (
          !isValidTime(startTime) ||
          !isValidTime(endTime) ||
          startTime >= endTime ||
          !Number.isFinite(bufferMin) ||
          bufferMin < 0 ||
          (slotIntervalMin !== undefined &&
            (!Number.isFinite(slotIntervalMin) ||
              !Number.isInteger(slotIntervalMin) ||
              slotIntervalMin <= 0))
        ) {
          setState((previous) => ({
            ...previous,
            error: `Invalid schedule for ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday]}.`,
            notice: null,
          }));
          return;
        }
      }

      setState((previous) => ({
        ...previous,
        savingWeeklyScheduleServiceId: serviceId,
        error: null,
        notice: null,
      }));

      try {
        let nextRules = [...state.availabilityRules];
        for (let weekday = 0; weekday < 7; weekday += 1) {
          const dayDraft = schedule[weekday] ?? createDefaultWeeklyScheduleDraft();
          const existingWeeklyRules = nextRules.filter(
            (rule) =>
              rule.serviceId === serviceId &&
              (rule.ruleType === "weekly" || rule.ruleType === undefined) &&
              rule.weekday === weekday,
          );

          if (!dayDraft.enabled) {
            for (const rule of existingWeeklyRules) {
              await deleteAvailabilityRule(rule.id);
            }
            nextRules = nextRules.filter((rule) => !existingWeeklyRules.some((item) => item.id === rule.id));
            continue;
          }

          const payload = {
            ruleType: "weekly" as const,
            weekday,
            startTime: dayDraft.startTime.trim(),
            endTime: dayDraft.endTime.trim(),
            bufferMin: Number(dayDraft.bufferMin),
            slotIntervalMin:
              dayDraft.slotIntervalMin.trim().length > 0
                ? Number(dayDraft.slotIntervalMin.trim())
                : null,
          };

          if (existingWeeklyRules.length === 0) {
            const created = normalizeAvailabilityRule(
              await createAvailabilityRule({
                serviceId,
                ...payload,
                slotIntervalMin: payload.slotIntervalMin ?? undefined,
              }),
            );
            nextRules.push(created);
            continue;
          }

          const [primaryRule, ...duplicateRules] = existingWeeklyRules;
          const updated = normalizeAvailabilityRule(
            await patchAvailabilityRule(primaryRule.id, payload),
          );
          nextRules = nextRules.map((rule) => (rule.id === primaryRule.id ? updated : rule));

          for (const duplicate of duplicateRules) {
            await deleteAvailabilityRule(duplicate.id);
          }
          nextRules = nextRules.filter(
            (rule) => !duplicateRules.some((duplicate) => duplicate.id === rule.id),
          );
        }

        const services = [...state.services];
        setState((previous) => ({
          ...previous,
          savingWeeklyScheduleServiceId: null,
          availabilityRules: nextRules,
          weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(services, nextRules),
          availabilityRuleEdits: mapAvailabilityRuleEdits(nextRules),
          notice: "Weekly schedule saved.",
        }));
      } catch (error) {
        setState((previous) => ({
          ...previous,
          savingWeeklyScheduleServiceId: null,
          error: messageFromError(error, "Could not save weekly schedule."),
        }));
      }
    },
    [state.availabilityRules, state.services, state.weeklyScheduleDraftsByServiceId],
  );

  const onExceptionDraftChange = useCallback(
    (
      serviceId: string,
      field: "date" | "mode" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
      value: string,
    ) => {
      setState((previous) => ({
        ...previous,
        exceptionDraftsByServiceId: {
          ...previous.exceptionDraftsByServiceId,
          [serviceId]: {
            ...(previous.exceptionDraftsByServiceId[serviceId] ?? createDefaultExceptionDraft()),
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const onCreateException = useCallback(
    async (serviceId: string) => {
      const draft = state.exceptionDraftsByServiceId[serviceId] ?? createDefaultExceptionDraft();
      const date = draft.date.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        setState((previous) => ({
          ...previous,
          error: "Exception date must use YYYY-MM-DD format.",
          notice: null,
        }));
        return;
      }

      const mode = draft.mode;
      const startTime = draft.startTime.trim();
      const endTime = draft.endTime.trim();
      const bufferMin = Number(draft.bufferMin);
      const slotIntervalRaw = draft.slotIntervalMin.trim();
      const slotIntervalMin =
        slotIntervalRaw.length > 0 ? Number(slotIntervalRaw) : undefined;

      if (
        (mode === "blocked_time" || mode === "custom_hours") &&
        (!isValidTime(startTime) ||
          !isValidTime(endTime) ||
          startTime >= endTime)
      ) {
        setState((previous) => ({
          ...previous,
          error: "Exception start/end time must use HH:mm and start must be before end.",
          notice: null,
        }));
        return;
      }

      if (
        mode === "custom_hours" &&
        (!Number.isFinite(bufferMin) ||
          bufferMin < 0 ||
          (slotIntervalMin !== undefined &&
            (!Number.isFinite(slotIntervalMin) ||
              !Number.isInteger(slotIntervalMin) ||
              slotIntervalMin <= 0)))
      ) {
        setState((previous) => ({
          ...previous,
          error: "Custom-hours exception needs buffer >= 0 and optional positive integer interval.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        creatingExceptionForServiceId: serviceId,
        error: null,
        notice: null,
      }));
      try {
        let created: AvailabilityRule;
        if (mode === "closed_all_day") {
          created = await createAvailabilityRule({
            serviceId,
            ruleType: "date_block",
            date,
            isClosedAllDay: true,
          });
        } else if (mode === "blocked_time") {
          created = await createAvailabilityRule({
            serviceId,
            ruleType: "date_block",
            date,
            startTime,
            endTime,
            isClosedAllDay: false,
          });
        } else {
          created = await createAvailabilityRule({
            serviceId,
            ruleType: "date_override",
            date,
            startTime,
            endTime,
            bufferMin,
            slotIntervalMin,
          });
        }

        const normalizedCreated = normalizeAvailabilityRule(created);
        setState((previous) => {
          const availabilityRules = [...previous.availabilityRules, normalizedCreated];
          return {
            ...previous,
            creatingExceptionForServiceId: null,
            availabilityRules,
            weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
              previous.services,
              availabilityRules,
            ),
            availabilityRuleEdits: mapAvailabilityRuleEdits(availabilityRules),
            exceptionDraftsByServiceId: {
              ...previous.exceptionDraftsByServiceId,
              [serviceId]: {
                ...createDefaultExceptionDraft(),
                date,
              },
            },
            notice: "Exception added.",
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          creatingExceptionForServiceId: null,
          error: messageFromError(error, "Could not create exception."),
        }));
      }
    },
    [state.exceptionDraftsByServiceId],
  );

  const onAvailabilityRuleDraftChange = useCallback(
    (
      serviceId: string,
      field: "weekday" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
      value: string,
    ) => {
      setState((previous) => ({
        ...previous,
        availabilityRuleDraftsByServiceId: {
          ...previous.availabilityRuleDraftsByServiceId,
          [serviceId]: {
            ...(previous.availabilityRuleDraftsByServiceId[serviceId] ??
              createDefaultAvailabilityRuleDraft()),
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const onCreateAvailabilityRule = useCallback(
    async (serviceId: string) => {
      const draft =
        state.availabilityRuleDraftsByServiceId[serviceId] ??
        createDefaultAvailabilityRuleDraft();
      const weekday = parseWeekday(draft.weekday);
      const startTime = draft.startTime.trim();
      const endTime = draft.endTime.trim();
      const bufferMin = Number(draft.bufferMin);
      const slotIntervalRaw = draft.slotIntervalMin.trim();
      const slotIntervalMin =
        slotIntervalRaw.length > 0 ? Number(slotIntervalRaw) : undefined;

      if (
        weekday === null ||
        !isValidTime(startTime) ||
        !isValidTime(endTime) ||
        startTime >= endTime ||
        !Number.isFinite(bufferMin) ||
        bufferMin < 0 ||
        (slotIntervalMin !== undefined &&
          (!Number.isFinite(slotIntervalMin) ||
            !Number.isInteger(slotIntervalMin) ||
            slotIntervalMin <= 0))
      ) {
        setState((previous) => ({
          ...previous,
          error:
            "Availability rule needs weekday (0-6), HH:mm start/end time, buffer >= 0, and optional positive integer slot interval.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        creatingAvailabilityForServiceId: serviceId,
        error: null,
        notice: null,
      }));
      try {
        const created = normalizeAvailabilityRule(await createAvailabilityRule({
          serviceId,
          weekday,
          startTime,
          endTime,
          bufferMin,
          slotIntervalMin,
        }));

        setState((previous) => {
          const availabilityRules = [...previous.availabilityRules, created];
          return {
            ...previous,
            creatingAvailabilityForServiceId: null,
            availabilityRules,
            weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
              previous.services,
              availabilityRules,
            ),
            availabilityRuleEdits: mapAvailabilityRuleEdits(availabilityRules),
            availabilityRuleDraftsByServiceId: {
              ...previous.availabilityRuleDraftsByServiceId,
              [serviceId]: createDefaultAvailabilityRuleDraft(),
            },
            notice: "Availability rule added.",
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          creatingAvailabilityForServiceId: null,
          error: messageFromError(error, "Could not create availability rule."),
        }));
      }
    },
    [state.availabilityRuleDraftsByServiceId],
  );

  const onAvailabilityRuleEditChange = useCallback(
    (
      ruleId: string,
      field: "weekday" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
      value: string,
    ) => {
      setState((previous) => ({
        ...previous,
        availabilityRuleEdits: {
          ...previous.availabilityRuleEdits,
          [ruleId]: {
            ...(previous.availabilityRuleEdits[ruleId] ?? createDefaultAvailabilityRuleDraft()),
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const onSaveAvailabilityRule = useCallback(
    async (ruleId: string) => {
      const draft = state.availabilityRuleEdits[ruleId];
      if (!draft) {
        return;
      }
      const weekday = parseWeekday(draft.weekday);
      const startTime = draft.startTime.trim();
      const endTime = draft.endTime.trim();
      const bufferMin = Number(draft.bufferMin);
      const slotIntervalRaw = draft.slotIntervalMin.trim();
      const slotIntervalMin =
        slotIntervalRaw.length > 0 ? Number(slotIntervalRaw) : null;

      if (
        weekday === null ||
        !isValidTime(startTime) ||
        !isValidTime(endTime) ||
        startTime >= endTime ||
        !Number.isFinite(bufferMin) ||
        bufferMin < 0 ||
        (slotIntervalMin !== null &&
          (!Number.isFinite(slotIntervalMin) ||
            !Number.isInteger(slotIntervalMin) ||
            slotIntervalMin <= 0))
      ) {
        setState((previous) => ({
          ...previous,
          error:
            "Availability rule needs weekday (0-6), HH:mm start/end time, buffer >= 0, and optional positive integer slot interval.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        mutatingAvailabilityRuleId: ruleId,
        error: null,
        notice: null,
      }));
      try {
        const updated = normalizeAvailabilityRule(await patchAvailabilityRule(ruleId, {
          weekday,
          startTime,
          endTime,
          bufferMin,
          slotIntervalMin,
        }));
        setState((previous) => {
          const availabilityRules = previous.availabilityRules.map((rule) =>
            rule.id === ruleId ? updated : rule,
          );
          return {
            ...previous,
            mutatingAvailabilityRuleId: null,
            availabilityRules,
            weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
              previous.services,
              availabilityRules,
            ),
            availabilityRuleEdits: mapAvailabilityRuleEdits(availabilityRules),
            notice: "Availability rule updated.",
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingAvailabilityRuleId: null,
          error: messageFromError(error, "Could not update availability rule."),
        }));
      }
    },
    [state.availabilityRuleEdits],
  );

  const onDeleteAvailabilityRule = useCallback(async (ruleId: string) => {
    setState((previous) => ({
      ...previous,
      mutatingAvailabilityRuleId: ruleId,
      error: null,
      notice: null,
    }));
    try {
      await deleteAvailabilityRule(ruleId);
      setState((previous) => {
        const availabilityRules = previous.availabilityRules.filter((rule) => rule.id !== ruleId);
        const availabilityRuleEdits = { ...previous.availabilityRuleEdits };
        delete availabilityRuleEdits[ruleId];
        return {
          ...previous,
          mutatingAvailabilityRuleId: null,
          availabilityRules,
          weeklyScheduleDraftsByServiceId: mapWeeklyScheduleDraftsByServiceId(
            previous.services,
            availabilityRules,
          ),
          availabilityRuleEdits,
          notice: "Availability rule deleted.",
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        mutatingAvailabilityRuleId: null,
        error: messageFromError(error, "Could not delete availability rule."),
      }));
    }
  }, []);

  const onTemplateDraftChange = useCallback((field: "name", value: string) => {
    setState((previous) => ({
      ...previous,
      templateDraft: {
        ...previous.templateDraft,
        [field]: value,
      },
    }));
  }, []);

  const onTemplateFieldChange = useCallback(
    (
      fieldId: string,
      field: "label" | "key" | "type" | "required" | "placeholder",
      value: string | boolean,
    ) => {
      setState((previous) => ({
        ...previous,
        templateDraft: {
          ...previous.templateDraft,
          fields: previous.templateDraft.fields.map((item) => {
            if (item.id !== fieldId) {
              return item;
            }
            if (
              isRequiredCoreFieldDraft(item) &&
              (field === "key" || field === "type" || field === "required")
            ) {
              return {
                ...item,
                required: true,
                type: normalizeFieldKey(item.key) === "email" ? "email" : item.type,
              };
            }
            if (field === "label") {
              const nextLabel = String(value);
              const canAutoKey = !item.key || item.key === toFieldKey(item.label);
              return {
                ...item,
                label: nextLabel,
                key: canAutoKey ? toFieldKey(nextLabel) : item.key,
              };
            }
            if (field === "required") {
              return {
                ...item,
                required: Boolean(value),
              };
            }
            return {
              ...item,
              [field]: String(value),
            };
          }),
        },
      }));
    },
    [],
  );

  const onAddTemplateField = useCallback(() => {
    setState((previous) => ({
      ...previous,
      templateDraft: {
        ...previous.templateDraft,
        fields: enforceRequiredCoreDraftFields([
          ...previous.templateDraft.fields,
          createEmptyFieldDraft(),
        ]),
      },
    }));
  }, []);

  const onRemoveTemplateField = useCallback((fieldId: string) => {
    setState((previous) => {
      const target = previous.templateDraft.fields.find((field) => field.id === fieldId);
      if (target && isRequiredCoreFieldDraft(target)) {
        return previous;
      }
      const remaining = previous.templateDraft.fields.filter((field) => field.id !== fieldId);
      return {
        ...previous,
        templateDraft: {
          ...previous.templateDraft,
          fields: enforceRequiredCoreDraftFields(
            remaining.length ? remaining : [createEmptyFieldDraft()],
          ),
        },
      };
    });
  }, []);

  const onCreateTemplate = useCallback(async () => {
    const name = state.templateDraft.name.trim();
    const mappedFields = mapDraftsToTemplateFields(state.templateDraft.fields);

    if (!name || !mappedFields.length) {
      setState((previous) => ({
        ...previous,
        error: "Template name and at least one field are required.",
        notice: null,
      }));
      return;
    }

    setState((previous) => ({ ...previous, creatingTemplate: true, error: null, notice: null }));
    try {
      const created = await createFormTemplate({
        name,
        fields: mappedFields,
      });
      setState((previous) => {
        const templates = [...previous.templates, created];
        return {
          ...previous,
          creatingTemplate: false,
          templates,
          templateEdits: mapTemplateEdits(templates),
          templateDraft: {
            name: "",
            fields: enforceRequiredCoreDraftFields([createEmptyFieldDraft()]),
          },
          notice: "Template created.",
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        creatingTemplate: false,
        error: messageFromError(error, "Could not create template."),
      }));
    }
  }, [state.templateDraft]);

  const onTemplateEditChange = useCallback((templateId: string, field: "name", value: string) => {
    setState((previous) => ({
      ...previous,
      templateEdits: {
        ...previous.templateEdits,
        [templateId]: {
          ...resolveTemplateEdit(previous, templateId),
          [field]: value,
        },
      },
    }));
  }, []);

  const onTemplateEditFieldChange = useCallback(
    (
      templateId: string,
      fieldId: string,
      field: "label" | "key" | "type" | "required" | "placeholder",
      value: string | boolean,
    ) => {
      setState((previous) => {
        const edit = resolveTemplateEdit(previous, templateId);
        return {
          ...previous,
          templateEdits: {
            ...previous.templateEdits,
            [templateId]: {
              ...edit,
              fields: edit.fields.map((item) => {
                if (item.id !== fieldId) {
                  return item;
                }
                if (
                  isRequiredCoreFieldDraft(item) &&
                  (field === "key" || field === "type" || field === "required")
                ) {
                  return {
                    ...item,
                    required: true,
                    type: normalizeFieldKey(item.key) === "email" ? "email" : item.type,
                  };
                }
                if (field === "label") {
                  const nextLabel = String(value);
                  const canAutoKey = !item.key || item.key === toFieldKey(item.label);
                  return {
                    ...item,
                    label: nextLabel,
                    key: canAutoKey ? toFieldKey(nextLabel) : item.key,
                  };
                }
                if (field === "required") {
                  return {
                    ...item,
                    required: Boolean(value),
                  };
                }
                return {
                  ...item,
                  [field]: String(value),
                };
              }),
            },
          },
        };
      });
    },
    [],
  );

  const onAddTemplateEditField = useCallback((templateId: string) => {
    setState((previous) => {
      const edit = resolveTemplateEdit(previous, templateId);
      return {
        ...previous,
        templateEdits: {
          ...previous.templateEdits,
          [templateId]: {
            ...edit,
            fields: enforceRequiredCoreDraftFields([
              ...edit.fields,
              createEmptyFieldDraft(),
            ]),
          },
        },
      };
    });
  }, []);

  const onRemoveTemplateEditField = useCallback((templateId: string, fieldId: string) => {
    setState((previous) => {
      const edit = resolveTemplateEdit(previous, templateId);
      const target = edit.fields.find((field) => field.id === fieldId);
      if (target && isRequiredCoreFieldDraft(target)) {
        return previous;
      }
      const remaining = edit.fields.filter((field) => field.id !== fieldId);
      return {
        ...previous,
        templateEdits: {
          ...previous.templateEdits,
          [templateId]: {
            ...edit,
            fields: enforceRequiredCoreDraftFields(
              remaining.length ? remaining : [createEmptyFieldDraft()],
            ),
          },
        },
      };
    });
  }, []);

  const onSaveTemplate = useCallback(
    async (templateId: string) => {
      const edit = resolveTemplateEdit(state, templateId);
      const name = edit.name.trim();
      const fields = mapDraftsToTemplateFields(edit.fields);
      if (!name || !fields.length) {
        setState((previous) => ({
          ...previous,
          error: "Template name and at least one field are required.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({ ...previous, mutatingTemplateId: templateId, error: null, notice: null }));
      try {
        const updated = await patchFormTemplate(templateId, { name, fields });
        setState((previous) => {
          const templates = previous.templates.map((item) => (item.id === templateId ? updated : item));
          return {
            ...previous,
            mutatingTemplateId: null,
            templates,
            templateEdits: mapTemplateEdits(templates),
            notice: "Template updated.",
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingTemplateId: null,
          error: messageFromError(error, "Could not update template."),
        }));
      }
    },
    [state],
  );

  const onDeleteTemplate = useCallback(async (templateId: string) => {
    setState((previous) => ({ ...previous, mutatingTemplateId: templateId, error: null, notice: null }));
    try {
      await deleteFormTemplate(templateId);
      setState((previous) => {
        const templates = previous.templates.filter((template) => template.id !== templateId);
        const services = previous.services.map((service) =>
          service.bookingFormTemplateId === templateId
            ? { ...service, bookingFormTemplateId: undefined }
            : service,
        );
        return {
          ...previous,
          mutatingTemplateId: null,
          services,
          templates,
          serviceEdits: mapServiceEdits(services),
          templateEdits: mapTemplateEdits(templates),
          notice: "Template deleted.",
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        mutatingTemplateId: null,
        error: messageFromError(error, "Could not delete template."),
      }));
    }
  }, []);

  const onSetServiceTemplate = useCallback(
    async (serviceId: string, templateId: string | null) => {
      const currentTemplateId =
        state.services.find((service) => service.id === serviceId)?.bookingFormTemplateId ?? null;
      if (currentTemplateId === templateId) {
        return;
      }

      setState((previous) => ({
        ...previous,
        mutatingTriggerServiceId: serviceId,
        error: null,
        notice: null,
      }));

      try {
        const updated = await patchService(serviceId, {
          bookingFormTemplateId: templateId,
        });
        setState((previous) => {
          const services = previous.services.map((service) =>
            service.id === serviceId ? updated : service,
          );
          return {
            ...previous,
            mutatingTriggerServiceId: null,
            services,
            serviceEdits: mapServiceEdits(services),
            notice: templateId
              ? "Service trigger form linked."
              : "Service trigger form cleared.",
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingTriggerServiceId: null,
          error: messageFromError(error, "Could not update trigger configuration."),
        }));
      }
    },
    [state.services],
  );

  const onPublicFlowFieldChange = useCallback(
    (
      category: "booking" | "contact",
      fieldId: string,
      field: "label" | "key" | "type" | "required" | "placeholder",
      value: string | boolean,
    ) => {
      setState((previous) => ({
        ...previous,
        publicFlowFieldDrafts: {
          ...previous.publicFlowFieldDrafts,
          [category]: previous.publicFlowFieldDrafts[category].map((item) => {
            if (item.id !== fieldId) {
              return item;
            }
            if (
              isRequiredCoreFieldDraft(item) &&
              (field === "key" || field === "type" || field === "required")
            ) {
              return {
                ...item,
                required: true,
                type: normalizeFieldKey(item.key) === "email" ? "email" : item.type,
              };
            }
            if (field === "label") {
              const nextLabel = String(value);
              const canAutoKey = !item.key || item.key === toFieldKey(item.label);
              return {
                ...item,
                label: nextLabel,
                key: canAutoKey ? toFieldKey(nextLabel) : item.key,
              };
            }
            if (field === "required") {
              return {
                ...item,
                required: Boolean(value),
              };
            }
            return {
              ...item,
              [field]: String(value),
            };
          }),
        },
      }));
    },
    [],
  );

  const onAddPublicFlowField = useCallback((category: "booking" | "contact") => {
    setState((previous) => ({
      ...previous,
      publicFlowFieldDrafts: {
        ...previous.publicFlowFieldDrafts,
        [category]: [...previous.publicFlowFieldDrafts[category], createEmptyFieldDraft()],
      },
    }));
  }, []);

  const onRemovePublicFlowField = useCallback((category: "booking" | "contact", fieldId: string) => {
    setState((previous) => {
      const target = previous.publicFlowFieldDrafts[category].find((field) => field.id === fieldId);
      if (target && isRequiredCoreFieldDraft(target)) {
        return previous;
      }
      const remaining = previous.publicFlowFieldDrafts[category].filter((field) => field.id !== fieldId);
      return {
        ...previous,
        publicFlowFieldDrafts: {
          ...previous.publicFlowFieldDrafts,
          [category]: enforceRequiredCoreDraftFields(remaining),
        },
      };
    });
  }, []);

  const onSavePublicFlowConfig = useCallback(async () => {
    const nextConfig: PublicFlowConfig = {
      booking: {
        fields: mapDraftsToPublicFlowFields(state.publicFlowFieldDrafts.booking),
      },
      contact: {
        fields: mapDraftsToPublicFlowFields(state.publicFlowFieldDrafts.contact),
      },
    };

    setState((previous) => ({
      ...previous,
      savingPublicFlowConfig: true,
      error: null,
      notice: null,
    }));

    try {
      const updated = await patchWorkspacePublicFlowConfig(nextConfig);
      setState((previous) => ({
        ...previous,
        savingPublicFlowConfig: false,
        publicFlowConfig: updated,
        publicFlowFieldDrafts: {
          booking: mapPublicFlowFieldsToDrafts(updated.booking.fields),
          contact: mapPublicFlowFieldsToDrafts(updated.contact.fields),
        },
        notice: "Public field configuration saved.",
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        savingPublicFlowConfig: false,
        error: messageFromError(error, "Could not save public field configuration."),
      }));
    }
  }, [state.publicFlowFieldDrafts.booking, state.publicFlowFieldDrafts.contact]);

  return {
    ...state,
    onRefresh: () => load(true),
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
    onAvailabilityRuleDraftChange,
    onCreateAvailabilityRule,
    onAvailabilityRuleEditChange,
    onSaveAvailabilityRule,
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
  };
}
