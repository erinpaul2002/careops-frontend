"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateConversationAiDraft,
  getConversationMessages,
  getConversations,
  getWorkspaceAiConfig,
  sendConversationMessage,
} from "@/lib/api/client";
import type { Conversation, Message } from "@/lib/api/types";
import type { InboxState } from "@/components/Inbox/types";

const fallbackState: InboxState = {
  loading: true,
  error: null,
  conversations: [],
  selectedConversationId: null,
  messages: [],
  draft: "",
  sending: false,
  aiAssistEnabled: false,
  aiProviderConfigured: false,
  draftingWithAi: false,
};

export function useInbox() {
  const [state, setState] = useState<InboxState>(fallbackState);

  const refresh = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState((previous) => ({ ...previous, loading: true, error: null }));
    }

    try {
      const [conversations, aiConfigResponse] = await Promise.all([
        getConversations(),
        getWorkspaceAiConfig().catch(() => null),
      ]);
      const firstId = conversations[0]?.id ?? null;

      let messages: Message[] = [];
      if (firstId) {
        const response = await getConversationMessages(firstId);
        messages = response.data;
      }

      setState((previous) => ({
        ...previous,
        loading: false,
        conversations,
        selectedConversationId: firstId,
        messages,
        aiAssistEnabled: aiConfigResponse?.aiConfig.inboxReplyAssistEnabled ?? false,
        aiProviderConfigured: aiConfigResponse?.groqConfigured ?? false,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        conversations: [],
        selectedConversationId: null,
        messages: [],
        error: "Unable to load inbox conversations.",
      }));
    }
  }, []);

  useEffect(() => {
    const kickoff = window.setTimeout(() => {
      void refresh(false);
    }, 0);
    return () => window.clearTimeout(kickoff);
  }, [refresh]);

  const onSelectConversation = useCallback(async (conversationId: string) => {
    setState((previous) => ({ ...previous, selectedConversationId: conversationId }));

    try {
      const response = await getConversationMessages(conversationId);
      setState((previous) => ({ ...previous, messages: response.data, error: null }));
    } catch {
      setState((previous) => ({
        ...previous,
        messages: [],
        error: "Unable to load conversation messages.",
      }));
    }
  }, []);

  const onDraftChange = useCallback((value: string) => {
    setState((previous) => ({ ...previous, draft: value }));
  }, []);

  const onSend = useCallback(async () => {
    const conversationId = state.selectedConversationId;
    if (!conversationId || !state.draft.trim()) {
      return;
    }

    const now = new Date().toISOString();
    const optimisticMessage: Message = {
      id: `local-${now}`,
      conversationId,
      direction: "outbound",
      channel: "email",
      body: state.draft.trim(),
      createdAt: now,
    };

    setState((previous) => ({
      ...previous,
      sending: true,
      draft: "",
      messages: [...previous.messages, optimisticMessage],
    }));

    try {
      await sendConversationMessage(conversationId, optimisticMessage.body);
      const response = await getConversationMessages(conversationId);
      setState((previous) => ({ ...previous, sending: false, messages: response.data }));
    } catch {
      setState((previous) => ({ ...previous, sending: false }));
    }
  }, [state.draft, state.selectedConversationId]);

  const onGenerateAiDraft = useCallback(async () => {
    const conversationId = state.selectedConversationId;
    if (!conversationId || !state.aiAssistEnabled) {
      return;
    }

    setState((previous) => ({ ...previous, draftingWithAi: true, error: null }));
    try {
      const nextDraft = await generateConversationAiDraft(
        conversationId,
        state.draft.trim() || undefined,
      );
      setState((previous) => ({
        ...previous,
        draftingWithAi: false,
        draft: nextDraft,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        draftingWithAi: false,
        error: "Unable to generate AI draft right now.",
      }));
    }
  }, [state.aiAssistEnabled, state.draft, state.selectedConversationId]);

  const selectedConversation: Conversation | undefined = useMemo(
    () => state.conversations.find((item) => item.id === state.selectedConversationId),
    [state.conversations, state.selectedConversationId],
  );

  return {
    ...state,
    selectedConversation,
    onSelectConversation,
    onDraftChange,
    onSend,
    onGenerateAiDraft,
    refresh,
  };
}
