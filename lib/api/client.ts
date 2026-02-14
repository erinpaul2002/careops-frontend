import { clearSessionState, getSessionState } from "@/lib/session";
import type {
  AiConfig,
  AvailabilityRule,
  AuthResponse,
  Booking,
  BookingStatus,
  Conversation,
  DashboardMetrics,
  DashboardSummary,
  FormTemplate,
  FormRequest,
  FormFileDownloadUrlPayload,
  IntegrationConnectResponse,
  IntegrationConnection,
  InventoryItem,
  Message,
  PublicFlowConfig,
  PublicFormPayload,
  PublicFormUploadUrlPayload,
  PublicSlotsPayload,
  Service,
  Slot,
  Workspace,
  WorkspaceReadiness,
  WorkspaceMember,
} from "@/lib/api/types";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const API_BASE = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  workspaceScoped?: boolean;
  idempotencyKey?: string;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, workspaceScoped = false, idempotencyKey } = options;
  const session = getSessionState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  if (workspaceScoped && session.workspaceId) {
    headers["x-workspace-id"] = session.workspaceId;
  }
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => undefined)) as
    | { error?: string }
    | undefined;

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearSessionState();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(payload?.error ?? `Request failed: ${response.status}`, response.status);
  }

  return payload as T;
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
  timezone?: string;
  address?: string;
  contactEmail?: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/register-owner", {
    method: "POST",
    body: input,
  });
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function staffLogin(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/staff-login", {
    method: "POST",
    body: input,
  });
}

export async function getMe(): Promise<{ user: AuthResponse["user"]; workspaces: Workspace[] }> {
  return requestJson<{ user: AuthResponse["user"]; workspaces: Workspace[] }>("/auth/me", {
    auth: true,
  });
}

export async function getDashboardSummary(date?: string): Promise<DashboardSummary> {
  const query = date ? `?date=${date}` : "";
  return requestJson<DashboardSummary>(`/dashboard/summary${query}`, {
    auth: true,
    workspaceScoped: true,
  });
}

export async function getDashboardMetrics(period = "30d"): Promise<DashboardMetrics> {
  return requestJson<DashboardMetrics>(`/dashboard/metrics?period=${period}`, {
    auth: true,
    workspaceScoped: true,
  });
}

export async function getConversations(status?: "open" | "pending" | "closed"): Promise<Conversation[]> {
  const query = status ? `?status=${status}` : "";
  const payload = await requestJson<{ data: Conversation[] }>(`/conversations${query}`, {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function getConversationMessages(
  conversationId: string,
): Promise<{ conversation: Conversation; data: Message[] }> {
  return requestJson<{ conversation: Conversation; data: Message[] }>(
    `/conversations/${conversationId}/messages`,
    {
      auth: true,
      workspaceScoped: true,
    },
  );
}

export async function sendConversationMessage(conversationId: string, body: string): Promise<void> {
  await requestJson<{ success: true }>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: { body },
  });
}

export async function generateConversationAiDraft(
  conversationId: string,
  instruction?: string,
): Promise<string> {
  const payload = await requestJson<{ draft: string }>(`/conversations/${conversationId}/ai-draft`, {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: instruction ? { instruction } : {},
  });
  return payload.draft;
}

export async function getBookings(filters: {
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }
  const query = params.toString();
  const payload = await requestJson<{ data: Booking[] }>(
    `/bookings${query.length ? `?${query}` : ""}`,
    {
      auth: true,
      workspaceScoped: true,
    },
  );
  return payload.data;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
  const payload = await requestJson<{ booking: Booking }>(`/bookings/${bookingId}/status`, {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: { status },
  });
  return payload.booking;
}

export async function getFormRequests(status?: "pending" | "completed" | "overdue"): Promise<FormRequest[]> {
  const query = status ? `?status=${status}` : "";
  const payload = await requestJson<{ data: FormRequest[] }>(`/form-requests${query}`, {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function getFormFileDownloadUrl(formRequestId: string, key: string): Promise<FormFileDownloadUrlPayload> {
  const query = `?key=${encodeURIComponent(key)}`;
  return requestJson<FormFileDownloadUrlPayload>(`/form-requests/${formRequestId}/files/download-url${query}`, {
    auth: true,
    workspaceScoped: true,
  });
}

export async function getServices(includeInactive = false): Promise<Service[]> {
  const query = includeInactive ? "?includeInactive=true" : "";
  const payload = await requestJson<{ data: Service[] }>(`/services${query}`, {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function createService(payload: {
  name: string;
  durationMin: number;
  locationType: "in_person" | "virtual";
  inventoryRules?: Array<{ itemId: string; quantity: number }>;
  bookingFormTemplateId?: string;
}): Promise<Service> {
  const response = await requestJson<{ service: Service }>("/services", {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.service;
}

export async function patchService(
  serviceId: string,
  payload: Partial<{
    name: string;
    durationMin: number;
    locationType: "in_person" | "virtual";
    isActive: boolean;
    inventoryRules: Array<{ itemId: string; quantity: number }>;
    bookingFormTemplateId: string | null;
  }>,
): Promise<Service> {
  const response = await requestJson<{ service: Service }>(`/services/${serviceId}`, {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.service;
}

export async function deleteService(serviceId: string): Promise<void> {
  await requestJson<{ success: true }>(`/services/${serviceId}`, {
    method: "DELETE",
    auth: true,
    workspaceScoped: true,
  });
}

export async function getAvailabilityRules(serviceId?: string): Promise<AvailabilityRule[]> {
  const query = serviceId ? `?serviceId=${serviceId}` : "";
  const payload = await requestJson<{ data: AvailabilityRule[] }>(`/availability-rules${query}`, {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function createAvailabilityRule(payload: {
  serviceId: string;
  ruleType?: "weekly" | "date_override" | "date_block";
  weekday?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  bufferMin?: number;
  slotIntervalMin?: number;
  isClosedAllDay?: boolean;
}): Promise<AvailabilityRule> {
  const response = await requestJson<{ rule: AvailabilityRule }>("/availability-rules", {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.rule;
}

export async function patchAvailabilityRule(
  ruleId: string,
  payload: Partial<{
    ruleType: "weekly" | "date_override" | "date_block";
    weekday: number;
    date: string;
    startTime: string;
    endTime: string;
    bufferMin: number;
    slotIntervalMin: number | null;
    isClosedAllDay: boolean;
  }>,
): Promise<AvailabilityRule> {
  const response = await requestJson<{ rule: AvailabilityRule }>(`/availability-rules/${ruleId}`, {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.rule;
}

export async function deleteAvailabilityRule(ruleId: string): Promise<void> {
  await requestJson<{ success: true }>(`/availability-rules/${ruleId}`, {
    method: "DELETE",
    auth: true,
    workspaceScoped: true,
  });
}

export async function getFormTemplates(includeInactive = false): Promise<FormTemplate[]> {
  const query = includeInactive ? "?includeInactive=true" : "";
  const payload = await requestJson<{ data: FormTemplate[] }>(`/form-templates${query}`, {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function createFormTemplate(payload: {
  name: string;
  fields: Array<Record<string, unknown>>;
  isActive?: boolean;
}): Promise<FormTemplate> {
  const response = await requestJson<{ template: FormTemplate }>("/form-templates", {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.template;
}

export async function patchFormTemplate(
  templateId: string,
  payload: Partial<{
    name: string;
    fields: Array<Record<string, unknown>>;
    isActive: boolean;
  }>,
): Promise<FormTemplate> {
  const response = await requestJson<{ template: FormTemplate }>(`/form-templates/${templateId}`, {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.template;
}

export async function deleteFormTemplate(templateId: string): Promise<void> {
  await requestJson<{ success: boolean }>(`/form-templates/${templateId}`, {
    method: "DELETE",
    auth: true,
    workspaceScoped: true,
  });
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const payload = await requestJson<{ data: InventoryItem[] }>("/inventory-items", {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function adjustInventoryItem(itemId: string, delta: number): Promise<InventoryItem> {
  const payload = await requestJson<{ item: InventoryItem }>(`/inventory-items/${itemId}/adjust`, {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: { delta },
  });
  return payload.item;
}

export async function createInventoryItem(payload: {
  name: string;
  unit: string;
  quantityOnHand: number;
  lowStockThreshold: number;
}): Promise<InventoryItem> {
  const response = await requestJson<{ item: InventoryItem }>("/inventory-items", {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.item;
}

export async function patchInventoryItem(
  itemId: string,
  payload: Partial<{
    name: string;
    unit: string;
    lowStockThreshold: number;
    isActive: boolean;
  }>,
): Promise<InventoryItem> {
  const response = await requestJson<{ item: InventoryItem }>(`/inventory-items/${itemId}`, {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: payload,
  });
  return response.item;
}

export async function archiveInventoryItem(itemId: string): Promise<InventoryItem> {
  const response = await requestJson<{ success: true; item: InventoryItem }>(`/inventory-items/${itemId}`, {
    method: "DELETE",
    auth: true,
    workspaceScoped: true,
  });
  return response.item;
}

export async function getIntegrations(): Promise<IntegrationConnection[]> {
  const payload = await requestJson<{ data: IntegrationConnection[] }>("/integrations", {
    auth: true,
    workspaceScoped: true,
  });
  return payload.data;
}

export async function connectIntegration(
  provider: "gmail" | "google-calendar",
): Promise<IntegrationConnectResponse> {
  return requestJson<IntegrationConnectResponse>(
    `/integrations/${provider}/connect`,
    {
      method: "POST",
      auth: true,
      workspaceScoped: true,
      body: {},
    },
  );
}

export async function syncIntegration(id: string): Promise<IntegrationConnection> {
  const payload = await requestJson<{ connection: IntegrationConnection }>(`/integrations/${id}/sync`, {
    method: "POST",
    auth: true,
    workspaceScoped: true,
    body: {},
  });
  return payload.connection;
}

export async function disconnectIntegration(id: string): Promise<IntegrationConnection> {
  const payload = await requestJson<{ connection: IntegrationConnection }>(`/integrations/${id}`, {
    method: "DELETE",
    auth: true,
    workspaceScoped: true,
  });
  return payload.connection;
}

export async function patchOnboardingStep(workspaceId: string, step: string, completed: boolean): Promise<Workspace> {
  const payload = await requestJson<{ workspace: Workspace }>(`/workspaces/${workspaceId}/onboarding`, {
    method: "PATCH",
    auth: true,
    body: {
      step,
      completed,
    },
  });
  return payload.workspace;
}

export async function patchOnboardingSteps(
  workspaceId: string,
  onboardingSteps: Record<string, boolean>,
): Promise<Workspace> {
  const payload = await requestJson<{ workspace: Workspace }>(`/workspaces/${workspaceId}/onboarding`, {
    method: "PATCH",
    auth: true,
    body: {
      onboardingSteps,
    },
  });
  return payload.workspace;
}

export async function activateWorkspace(workspaceId: string): Promise<Workspace> {
  const payload = await requestJson<{ workspace: Workspace }>(`/workspaces/${workspaceId}/activate`, {
    method: "POST",
    auth: true,
  });
  return payload.workspace;
}

export async function deactivateWorkspace(workspaceId: string): Promise<Workspace> {
  const payload = await requestJson<{ workspace: Workspace }>(`/workspaces/${workspaceId}/deactivate`, {
    method: "POST",
    auth: true,
  });
  return payload.workspace;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const payload = await requestJson<{ data: WorkspaceMember[] }>(`/workspaces/${workspaceId}/members`, {
    auth: true,
  });
  return payload.data;
}

export async function createWorkspaceMember(
  workspaceId: string,
  payload: {
    name: string;
    email: string;
    password: string;
    role?: "owner" | "staff";
  },
): Promise<{ member: WorkspaceMember }> {
  return requestJson<{ member: WorkspaceMember }>(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await requestJson<{ success: true }>(`/workspaces/${workspaceId}/members/${userId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: "owner" | "staff",
): Promise<{ member: WorkspaceMember }> {
  return requestJson<{ member: WorkspaceMember }>(`/workspaces/${workspaceId}/members/${userId}/role`, {
    method: "PATCH",
    auth: true,
    body: { role },
  });
}

export async function getWorkspacePublicFlowConfig(): Promise<PublicFlowConfig> {
  const payload = await requestJson<{ publicFlowConfig: PublicFlowConfig }>("/public-flow-config", {
    auth: true,
    workspaceScoped: true,
  });
  return payload.publicFlowConfig;
}

export async function patchWorkspacePublicFlowConfig(
  config: PublicFlowConfig,
): Promise<PublicFlowConfig> {
  const payload = await requestJson<{ publicFlowConfig: PublicFlowConfig }>("/public-flow-config", {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: config,
  });
  return payload.publicFlowConfig;
}

export async function getWorkspaceReadiness(): Promise<WorkspaceReadiness> {
  const payload = await requestJson<{ readiness: WorkspaceReadiness }>("/workspace-readiness", {
    auth: true,
    workspaceScoped: true,
  });
  return payload.readiness;
}

export async function getWorkspaceAiConfig(): Promise<{ aiConfig: AiConfig; groqConfigured: boolean }> {
  return requestJson<{ aiConfig: AiConfig; groqConfigured: boolean }>("/ai-config", {
    auth: true,
    workspaceScoped: true,
  });
}

export async function patchWorkspaceAiConfig(
  config: Partial<AiConfig>,
): Promise<{ aiConfig: AiConfig; groqConfigured: boolean }> {
  return requestJson<{ aiConfig: AiConfig; groqConfigured: boolean }>("/ai-config", {
    method: "PATCH",
    auth: true,
    workspaceScoped: true,
    body: config,
  });
}

export async function getPublicFlowConfig(workspaceId: string): Promise<PublicFlowConfig> {
  const payload = await requestJson<{ publicFlowConfig: PublicFlowConfig }>(
    `/public/${workspaceId}/public-flow-config`,
  );
  return payload.publicFlowConfig;
}

export async function getPublicServices(workspaceId: string): Promise<Service[]> {
  const payload = await requestJson<{ data: Service[] }>(`/public/${workspaceId}/services`);
  return payload.data;
}

export async function getPublicSlots(
  workspaceId: string,
  serviceId: string,
  date: string,
): Promise<PublicSlotsPayload> {
  const payload = await requestJson<{ slots: Slot[]; timezone?: string }>(
    `/public/${workspaceId}/slots?serviceId=${serviceId}&date=${date}`,
  );
  return {
    slots: payload.slots,
    timezone: payload.timezone ?? "UTC",
  };
}

export async function createPublicBooking(
  workspaceId: string,
  payload: {
    serviceId: string;
    startsAt: string;
    fields: Record<string, unknown>;
  },
): Promise<{ booking: Booking; formRequest?: { id: string; publicToken: string; status: string } | null }> {
  return requestJson<{ booking: Booking; formRequest?: { id: string; publicToken: string; status: string } | null }>(
    `/public/${workspaceId}/bookings`,
    {
      method: "POST",
      body: payload,
      idempotencyKey: createIdempotencyKey(),
    },
  );
}

export async function submitPublicContact(
  workspaceId: string,
  payload: {
    fields: Record<string, unknown>;
  },
): Promise<{ conversationId: string }> {
  return requestJson<{ conversationId: string }>(`/public/${workspaceId}/contact`, {
    method: "POST",
    body: payload,
  });
}

export async function getPublicForm(token: string): Promise<PublicFormPayload> {
  return requestJson<PublicFormPayload>(`/public/forms/${token}`);
}

export async function submitPublicForm(
  token: string,
  payload: Record<string, unknown>,
): Promise<{ formRequestId: string; status: string; completedAt: string }> {
  return requestJson<{ formRequestId: string; status: string; completedAt: string }>(
    `/public/forms/${token}/submit`,
    {
      method: "POST",
      body: payload,
      idempotencyKey: createIdempotencyKey(),
    },
  );
}

export async function createPublicFormFileUploadUrl(
  token: string,
  payload: {
    fieldKey: string;
    fileName: string;
    contentType: string;
    size: number;
  },
): Promise<PublicFormUploadUrlPayload> {
  return requestJson<PublicFormUploadUrlPayload>(`/public/forms/${token}/files/presign-upload`, {
    method: "POST",
    body: payload,
  });
}

export async function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });
  if (!response.ok) {
    throw new ApiError(`Upload failed with status ${response.status}`, response.status);
  }
}
