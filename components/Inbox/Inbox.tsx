"use client";

import InboxUI from "@/components/Inbox/InboxUI";
import { useInbox } from "@/components/Inbox/useInbox";

export default function Inbox() {
  const {
    loading,
    error,
    conversations,
    selectedConversationId,
    messages,
    draft,
    sending,
    aiAssistEnabled,
    aiProviderConfigured,
    draftingWithAi,
    onSelectConversation,
    onDraftChange,
    onSend,
    onGenerateAiDraft,
    refresh,
  } = useInbox();

  return (
    <InboxUI
      loading={loading}
      error={error}
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      messages={messages}
      draft={draft}
      sending={sending}
      aiAssistEnabled={aiAssistEnabled}
      aiProviderConfigured={aiProviderConfigured}
      draftingWithAi={draftingWithAi}
      onSelectConversation={onSelectConversation}
      onDraftChange={onDraftChange}
      onSend={onSend}
      onGenerateAiDraft={onGenerateAiDraft}
      onRefresh={refresh}
    />
  );
}
