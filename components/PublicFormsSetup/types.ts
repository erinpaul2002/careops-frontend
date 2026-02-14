import type {
  AvailabilityRule,
  FormTemplate,
  PublicFlowConfig,
  Service,
} from "@/lib/api/types";

export type PublicSetupModule = "services" | "templates" | "trigger" | "fields";

export interface TemplateFieldDraft {
  id: string;
  label: string;
  key: string;
  type: string;
  required: boolean;
  placeholder: string;
}

export interface AvailabilityRuleDraft {
  weekday: string;
  startTime: string;
  endTime: string;
  bufferMin: string;
  slotIntervalMin: string;
}

export interface WeeklyScheduleDraft {
  enabled: boolean;
  startTime: string;
  endTime: string;
  bufferMin: string;
  slotIntervalMin: string;
}

export interface AvailabilityExceptionDraft {
  date: string;
  mode: "closed_all_day" | "blocked_time" | "custom_hours";
  startTime: string;
  endTime: string;
  bufferMin: string;
  slotIntervalMin: string;
}

export interface PublicFormsSetupState {
  loading: boolean;
  error: string | null;
  notice: string | null;
  services: Service[];
  availabilityRules: AvailabilityRule[];
  weeklyScheduleDraftsByServiceId: Record<string, Record<number, WeeklyScheduleDraft>>;
  exceptionDraftsByServiceId: Record<string, AvailabilityExceptionDraft>;
  availabilityRuleEdits: Record<string, AvailabilityRuleDraft>;
  availabilityRuleDraftsByServiceId: Record<string, AvailabilityRuleDraft>;
  templates: FormTemplate[];
  serviceDraft: {
    name: string;
    durationMin: string;
    locationType: "in_person" | "virtual";
  };
  templateDraft: {
    name: string;
    fields: TemplateFieldDraft[];
  };
  serviceEdits: Record<
    string,
    {
      name: string;
      durationMin: string;
      locationType: "in_person" | "virtual";
    }
  >;
  templateEdits: Record<
    string,
    {
      name: string;
      fields: TemplateFieldDraft[];
    }
  >;
  mutatingServiceId: string | null;
  mutatingAvailabilityRuleId: string | null;
  creatingAvailabilityForServiceId: string | null;
  savingWeeklyScheduleServiceId: string | null;
  creatingExceptionForServiceId: string | null;
  mutatingTemplateId: string | null;
  mutatingTriggerServiceId: string | null;
  creatingService: boolean;
  creatingTemplate: boolean;
  publicFlowConfig: PublicFlowConfig;
  publicFlowFieldDrafts: {
    booking: TemplateFieldDraft[];
    contact: TemplateFieldDraft[];
  };
  savingPublicFlowConfig: boolean;
  onboardingWarnings: string[];
}

export interface PublicFormsSetupUIProps extends PublicFormsSetupState {
  activeModule: PublicSetupModule;
  onModuleChange: (module: PublicSetupModule) => void;
  moduleNavigation?: "enabled" | "disabled";
  onRefresh: () => Promise<void>;
  onServiceDraftChange: (
    field: "name" | "durationMin" | "locationType",
    value: string,
  ) => void;
  onCreateService: () => Promise<void>;
  onServiceEditChange: (
    serviceId: string,
    field: "name" | "durationMin" | "locationType",
    value: string,
  ) => void;
  onSaveService: (serviceId: string) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onToggleService: (serviceId: string, isActive: boolean) => Promise<void>;
  onWeeklyScheduleDraftChange: (
    serviceId: string,
    weekday: number,
    field: "enabled" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
    value: string | boolean,
  ) => void;
  onSaveWeeklySchedule: (serviceId: string) => Promise<void>;
  onExceptionDraftChange: (
    serviceId: string,
    field: "date" | "mode" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
    value: string,
  ) => void;
  onCreateException: (serviceId: string) => Promise<void>;
  onAvailabilityRuleDraftChange: (
    serviceId: string,
    field: "weekday" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
    value: string,
  ) => void;
  onCreateAvailabilityRule: (serviceId: string) => Promise<void>;
  onAvailabilityRuleEditChange: (
    ruleId: string,
    field: "weekday" | "startTime" | "endTime" | "bufferMin" | "slotIntervalMin",
    value: string,
  ) => void;
  onSaveAvailabilityRule: (ruleId: string) => Promise<void>;
  onDeleteAvailabilityRule: (ruleId: string) => Promise<void>;
  onTemplateDraftChange: (field: "name", value: string) => void;
  onTemplateFieldChange: (
    fieldId: string,
    field: "label" | "key" | "type" | "required" | "placeholder",
    value: string | boolean,
  ) => void;
  onAddTemplateField: () => void;
  onRemoveTemplateField: (fieldId: string) => void;
  onCreateTemplate: () => Promise<void>;
  onTemplateEditChange: (templateId: string, field: "name", value: string) => void;
  onTemplateEditFieldChange: (
    templateId: string,
    fieldId: string,
    field: "label" | "key" | "type" | "required" | "placeholder",
    value: string | boolean,
  ) => void;
  onAddTemplateEditField: (templateId: string) => void;
  onRemoveTemplateEditField: (templateId: string, fieldId: string) => void;
  onSaveTemplate: (templateId: string) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onSetServiceTemplate: (
    serviceId: string,
    templateId: string | null,
  ) => Promise<void>;
  onPublicFlowFieldChange: (
    category: "booking" | "contact",
    fieldId: string,
    field: "label" | "key" | "type" | "required" | "placeholder",
    value: string | boolean,
  ) => void;
  onAddPublicFlowField: (category: "booking" | "contact") => void;
  onRemovePublicFlowField: (category: "booking" | "contact", fieldId: string) => void;
  onSavePublicFlowConfig: () => Promise<void>;
}
