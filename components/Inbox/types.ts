import type { Conversation, Message } from "@/lib/api/types";

export interface InboxState {
  loading: boolean;
  error: string | null;
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  draft: string;
  sending: boolean;
  aiAssistEnabled: boolean;
  aiProviderConfigured: boolean;
  draftingWithAi: boolean;
}

export interface InboxUIProps extends InboxState {
  onSelectConversation: (conversationId: string) => Promise<void>;
  onDraftChange: (value: string) => void;
  onSend: () => Promise<void>;
  onGenerateAiDraft: () => Promise<void>;
  onRefresh: () => Promise<void>;
}
