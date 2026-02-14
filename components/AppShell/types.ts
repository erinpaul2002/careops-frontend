import type { LucideIcon } from "lucide-react";

export type AppShellRole = "owner" | "staff";

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AppShellUIProps {
  title: string;
  workspaceLabel: string;
  navItems: AppNavItem[];
  children: React.ReactNode;
  onSignOut: () => void;
}
