export type Role = "owner" | "staff";

export interface PublicFieldConfig {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface PublicFlowConfig {
  booking: {
    fields: PublicFieldConfig[];
  };
  contact: {
    fields: PublicFieldConfig[];
  };
}

export interface AiConfig {
  contactAutoReplyEnabled: boolean;
  inboxReplyAssistEnabled: boolean;
}
export interface User {
  id: string;
  name: string;
  email: string;
  status?: "invited" | "active" | "disabled";
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  address?: string;
  contactEmail?: string;
  onboardingStatus?: "draft" | "active";
  onboardingSteps?: Record<string, boolean>;
  publicFlowConfig?: PublicFlowConfig;
  aiConfig?: AiConfig;
  role?: Role;
}

export interface WorkspaceReadiness {
  onboardingStatus: "draft" | "active";
  completion: Record<string, boolean>;
  missingSteps: string[];
  warnings: string[];
  blockers: string[];
  canActivate: boolean;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  user: User | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
  workspace?: Workspace;
  workspaces?: Workspace[];
}

export interface AlertItem {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  createdAt: string;
}

export interface DashboardSummary {
  date: string;
  bookingsToday: number;
  newLeadsToday: number;
  unansweredConversations: number;
  pendingForms: number;
  lowStockItems: number;
  alerts: AlertItem[];
}

export interface DashboardMetrics {
  period: string;
  generatedAt: string;
  metrics: {
    leads: number;
    bookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    bookingConversionRatePct: number;
    completionRatePct: number;
  };
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  status: "open" | "pending" | "closed";
  channel: "email" | "sms";
  lastMessageAt: string;
  contact?: Contact;
  latestMessage?: {
    body: string;
    direction: "inbound" | "outbound";
    createdAt: string;
  } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  channel: "email" | "sms";
  body: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  locationType: "in_person" | "virtual";
  inventoryRules?: Array<{
    itemId: string;
    quantity: number;
  }>;
  bookingFormTemplateId?: string;
  isActive: boolean;
}

export interface AvailabilityRule {
  id: string;
  serviceId: string;
  ruleType?: "weekly" | "date_override" | "date_block";
  weekday?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  bufferMin?: number;
  slotIntervalMin?: number;
  isClosedAllDay?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Booking {
  id: string;
  workspaceId?: string;
  contactId?: string;
  serviceId?: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  calendarEventId?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  contact?: Contact;
  service?: Service;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
}

export interface PublicSlotsPayload {
  slots: Slot[];
  timezone: string;
}

export interface FormTemplateField {
  key?: string;
  name?: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

export interface UploadedFormFile {
  key: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface FormFileDownloadUrlPayload {
  key: string;
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface PublicFormUploadUrlPayload {
  key: string;
  uploadUrl: string;
  expiresInSeconds: number;
  maxSizeBytes: number;
  allowedContentTypes: string[];
}

export interface FormTemplate {
  id: string;
  name: string;
  fields: FormTemplateField[];
  trigger?: "post_booking";
  isActive?: boolean;
}

export interface FormRequest {
  id: string;
  workspaceId?: string;
  bookingId?: string;
  contactId?: string;
  templateId?: string;
  publicToken?: string;
  status: "pending" | "completed" | "overdue";
  dueAt: string;
  completedAt?: string;
  submission?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  contact?: Contact;
  booking?: Booking;
  template?: FormTemplate;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantityOnHand: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface IntegrationConnection {
  id: string;
  provider: "gmail" | "google_calendar" | "twilio";
  status: "connected" | "error" | "disconnected";
  scopes: string[];
  errorMessage?: string;
  lastSyncAt?: string;
}

export interface IntegrationConnectResponse {
  provider: "gmail" | "google-calendar";
  authUrl: string;
}

export interface PublicFormPayload {
  formRequest: {
    id: string;
    status: "pending" | "completed" | "overdue";
    dueAt: string;
  };
  template: FormTemplate;
}
