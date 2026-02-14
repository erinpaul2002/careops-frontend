import type {
  Booking,
  Conversation,
  DashboardMetrics,
  DashboardSummary,
  FormRequest,
  IntegrationConnection,
  InventoryItem,
  Message,
  PublicFormPayload,
  Service,
  Slot,
} from "@/lib/api/types";

const now = new Date();

export const mockDashboardSummary: DashboardSummary = {
  date: now.toISOString().slice(0, 10),
  bookingsToday: 9,
  newLeadsToday: 5,
  unansweredConversations: 3,
  pendingForms: 7,
  lowStockItems: 2,
  alerts: [
    {
      id: "alert-1",
      type: "inventory.low_stock",
      severity: "warning",
      message: "Nitrile gloves are below threshold.",
      createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: "alert-2",
      type: "conversation.unanswered",
      severity: "critical",
      message: "2 inbound messages are waiting for response.",
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
  ],
};

export const mockDashboardMetrics: DashboardMetrics = {
  period: "30d",
  generatedAt: now.toISOString(),
  metrics: {
    leads: 121,
    bookings: 83,
    confirmedBookings: 71,
    completedBookings: 64,
    cancelledBookings: 10,
    noShowBookings: 9,
    bookingConversionRatePct: 68.6,
    completionRatePct: 77.1,
  },
};

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    status: "open",
    channel: "email",
    lastMessageAt: new Date(now.getTime() - 16 * 60 * 1000).toISOString(),
    contact: {
      id: "contact-1",
      firstName: "Mia",
      lastName: "Rodriguez",
      email: "mia@example.com",
    },
    latestMessage: {
      body: "Can I move my appointment to Friday?",
      direction: "inbound",
      createdAt: new Date(now.getTime() - 16 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "conv-2",
    status: "pending",
    channel: "sms",
    lastMessageAt: new Date(now.getTime() - 85 * 60 * 1000).toISOString(),
    contact: {
      id: "contact-2",
      firstName: "Jordan",
      lastName: "Lee",
      phone: "+1 555 201 9901",
    },
    latestMessage: {
      body: "Thanks, I submitted the intake form.",
      direction: "outbound",
      createdAt: new Date(now.getTime() - 85 * 60 * 1000).toISOString(),
    },
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    direction: "inbound",
    channel: "email",
    body: "Can I move my appointment to Friday?",
    createdAt: new Date(now.getTime() - 16 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    direction: "outbound",
    channel: "email",
    body: "Yes, Friday has an opening at 11:00 AM.",
    createdAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
  },
];

export const mockBookings: Booking[] = [
  {
    id: "booking-1",
    startsAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    endsAt: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
    status: "confirmed",
    contact: {
      id: "contact-1",
      firstName: "Mia",
      lastName: "Rodriguez",
      email: "mia@example.com",
    },
    service: {
      id: "service-1",
      name: "Initial Consultation",
      durationMin: 30,
      locationType: "virtual",
      isActive: true,
    },
  },
  {
    id: "booking-2",
    startsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    contact: {
      id: "contact-2",
      firstName: "Jordan",
      lastName: "Lee",
      phone: "+1 555 201 9901",
    },
    service: {
      id: "service-2",
      name: "Follow-up Session",
      durationMin: 60,
      locationType: "in_person",
      isActive: true,
    },
  },
];

export const mockFormRequests: FormRequest[] = [
  {
    id: "form-request-1",
    status: "pending",
    dueAt: new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString(),
    contact: {
      id: "contact-1",
      firstName: "Mia",
      lastName: "Rodriguez",
      email: "mia@example.com",
    },
    template: {
      id: "template-1",
      name: "Intake Form",
      fields: [
        { key: "symptoms", label: "Symptoms", type: "textarea", required: true },
      ],
    },
  },
  {
    id: "form-request-2",
    status: "overdue",
    dueAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
    contact: {
      id: "contact-2",
      firstName: "Jordan",
      lastName: "Lee",
      phone: "+1 555 201 9901",
    },
    template: {
      id: "template-1",
      name: "Intake Form",
      fields: [],
    },
  },
];

export const mockInventoryItems: InventoryItem[] = [
  {
    id: "item-1",
    name: "Nitrile Gloves",
    unit: "boxes",
    quantityOnHand: 4,
    lowStockThreshold: 5,
    isActive: true,
  },
  {
    id: "item-2",
    name: "Sanitizer",
    unit: "bottles",
    quantityOnHand: 12,
    lowStockThreshold: 6,
    isActive: true,
  },
];

export const mockIntegrations: IntegrationConnection[] = [
  {
    id: "integration-1",
    provider: "gmail",
    status: "connected",
    scopes: ["gmail.send", "gmail.readonly"],
    lastSyncAt: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "integration-2",
    provider: "google_calendar",
    status: "connected",
    scopes: ["calendar.events"],
    lastSyncAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
  },
];

export const mockPublicServices: Service[] = [
  {
    id: "service-1",
    name: "Initial Consultation",
    durationMin: 30,
    locationType: "virtual",
    bookingFormTemplateId: "template-1",
    isActive: true,
  },
  {
    id: "service-2",
    name: "Follow-up Session",
    durationMin: 60,
    locationType: "in_person",
    bookingFormTemplateId: "template-2",
    isActive: true,
  },
];

export const mockServices: Service[] = [
  ...mockPublicServices,
  {
    id: "service-3",
    name: "Home Visit Assessment",
    durationMin: 45,
    locationType: "in_person",
    isActive: false,
  },
];

export const mockFormTemplates: PublicFormPayload["template"][] = [
  {
    id: "template-1",
    name: "Client Intake",
    trigger: "post_booking",
    isActive: true,
    fields: [
      { key: "primary_goal", label: "Primary Goal", type: "text", required: true },
      { key: "health_notes", label: "Health Notes", type: "textarea", required: false },
    ],
  },
  {
    id: "template-2",
    name: "Consent Confirmation",
    trigger: "post_booking",
    isActive: false,
    fields: [
      { key: "consent", label: "I agree to treatment terms", type: "checkbox", required: true },
    ],
  },
];

export const mockPublicSlots: Slot[] = [
  {
    startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(now.getTime() + 24.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    startsAt: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(now.getTime() + 25.5 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockPublicFormPayload: PublicFormPayload = {
  formRequest: {
    id: "form-request-1",
    status: "pending",
    dueAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  template: {
    id: "template-1",
    name: "Client Intake",
    fields: [
      { key: "allergies", label: "Allergies", type: "textarea", required: false },
      { key: "consent", label: "I agree to treatment terms", type: "checkbox", required: true },
    ],
  },
};
