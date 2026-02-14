"use client";

import SettingsIntegrationsUI from "@/components/SettingsIntegrations/SettingsIntegrationsUI";
import { useSettingsIntegrations } from "@/components/SettingsIntegrations/useSettingsIntegrations";

export default function SettingsIntegrations() {
  const {
    loading,
    error,
    connections,
    mutatingProvider,
    aiConfig,
    groqConfigured,
    savingAiConfig,
    onConnect,
    onSync,
    onDisconnect,
    onUpdateAiConfig,
    onRefresh,
  } = useSettingsIntegrations();

  return (
    <SettingsIntegrationsUI
      loading={loading}
      error={error}
      connections={connections}
      mutatingProvider={mutatingProvider}
      aiConfig={aiConfig}
      groqConfigured={groqConfigured}
      savingAiConfig={savingAiConfig}
      onConnect={onConnect}
      onSync={onSync}
      onDisconnect={onDisconnect}
      onUpdateAiConfig={onUpdateAiConfig}
      onRefresh={onRefresh}
    />
  );
}
