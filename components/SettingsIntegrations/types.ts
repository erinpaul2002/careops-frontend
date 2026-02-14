import type { AiConfig, IntegrationConnection } from "@/lib/api/types";

export interface SettingsIntegrationsState {
  loading: boolean;
  error: string | null;
  connections: IntegrationConnection[];
  mutatingProvider: string | null;
  aiConfig: AiConfig;
  groqConfigured: boolean;
  savingAiConfig: boolean;
}

export interface SettingsIntegrationsUIProps extends SettingsIntegrationsState {
  onConnect: (provider: "gmail" | "google-calendar") => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onUpdateAiConfig: (next: Partial<AiConfig>) => Promise<void>;
  onRefresh: () => Promise<void>;
}
