"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectIntegration,
  disconnectIntegration,
  getIntegrations,
  getWorkspaceAiConfig,
  patchWorkspaceAiConfig,
  syncIntegration,
} from "@/lib/api/client";
import { mockIntegrations } from "@/lib/api/mockData";
import type { SettingsIntegrationsState } from "@/components/SettingsIntegrations/types";

const initialState: SettingsIntegrationsState = {
  loading: true,
  error: null,
  connections: [],
  mutatingProvider: null,
  aiConfig: {
    contactAutoReplyEnabled: false,
    inboxReplyAssistEnabled: false,
  },
  groqConfigured: false,
  savingAiConfig: false,
};

export function useSettingsIntegrations() {
  const [state, setState] = useState<SettingsIntegrationsState>(initialState);

  const refresh = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const [connections, aiSettings] = await Promise.all([
        getIntegrations(),
        getWorkspaceAiConfig(),
      ]);
      setState((previous) => ({
        ...previous,
        loading: false,
        connections,
        aiConfig: aiSettings.aiConfig,
        groqConfigured: aiSettings.groqConfigured,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        connections: mockIntegrations,
        error: "Showing fallback integration preview.",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const oauthStatus = searchParams.get("integration_oauth");
    if (!oauthStatus) {
      return;
    }

    if (oauthStatus === "success") {
      void refresh();
    } else if (oauthStatus === "error") {
      const message = searchParams.get("message") ?? "Google integration failed.";
      setState((previous) => ({
        ...previous,
        error: message,
      }));
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("integration_oauth");
    nextUrl.searchParams.delete("provider");
    nextUrl.searchParams.delete("message");
    window.history.replaceState({}, "", nextUrl.toString());
  }, [refresh]);

  const onConnect = useCallback(async (provider: "gmail" | "google-calendar") => {
    setState((previous) => ({ ...previous, mutatingProvider: provider }));
    try {
      const result = await connectIntegration(provider);
      if (typeof window !== "undefined") {
        window.location.assign(result.authUrl);
        return;
      }
    } catch {
      setState((previous) => ({
        ...previous,
        mutatingProvider: null,
        error: `Could not connect ${provider}.`,
      }));
    } finally {
      setState((previous) => ({ ...previous, mutatingProvider: null }));
    }
  }, []);

  const onSync = useCallback(async (id: string) => {
    setState((previous) => ({ ...previous, mutatingProvider: id }));
    try {
      await syncIntegration(id);
      await refresh();
    } finally {
      setState((previous) => ({ ...previous, mutatingProvider: null }));
    }
  }, [refresh]);

  const onDisconnect = useCallback(async (id: string) => {
    setState((previous) => ({ ...previous, mutatingProvider: id }));
    try {
      await disconnectIntegration(id);
      await refresh();
    } finally {
      setState((previous) => ({ ...previous, mutatingProvider: null }));
    }
  }, [refresh]);

  const onUpdateAiConfig = useCallback(async (next: Partial<SettingsIntegrationsState["aiConfig"]>) => {
    setState((previous) => ({ ...previous, savingAiConfig: true, error: null }));
    try {
      const response = await patchWorkspaceAiConfig(next);
      setState((previous) => ({
        ...previous,
        savingAiConfig: false,
        aiConfig: response.aiConfig,
        groqConfigured: response.groqConfigured,
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        savingAiConfig: false,
        error: "Could not update AI settings.",
      }));
    }
  }, []);

  return {
    ...state,
    onConnect,
    onSync,
    onDisconnect,
    onUpdateAiConfig,
    onRefresh: refresh,
  };
}
