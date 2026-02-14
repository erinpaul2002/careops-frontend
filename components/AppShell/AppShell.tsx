"use client";

import type { ReactNode } from "react";
import AppShellUI from "@/components/AppShell/AppShellUI";
import type { AppShellRole } from "@/components/AppShell/types";
import { useAppShell } from "@/components/AppShell/useAppShell";

interface AppShellProps {
  children: ReactNode;
  role?: AppShellRole;
  basePath?: string;
}

export default function AppShell({ children, role = "owner", basePath = "" }: AppShellProps) {
  const { title, workspaceLabel, navItems, onSignOut } = useAppShell({ role, basePath });

  return (
    <AppShellUI
      title={title}
      workspaceLabel={workspaceLabel}
      navItems={navItems}
      onSignOut={onSignOut}
    >
      {children}
    </AppShellUI>
  );
}
