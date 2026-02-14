"use client";

import { useMemo, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  CalendarCheck,
  Gauge,
  LayoutDashboard,
  Link2,
  Mail,
  Users,
  Workflow,
} from "lucide-react";
import type { AppNavItem, AppShellRole } from "@/components/AppShell/types";
import { getMe } from "@/lib/api/client";
import {
  clearSessionState,
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSessionState,
} from "@/lib/session";

interface UseAppShellOptions {
  role: AppShellRole;
  basePath?: string;
}

interface RoleNavItemConfig {
  path: string;
  label: string;
  icon: AppNavItem["icon"];
}

const ownerNavConfig: RoleNavItemConfig[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/staff", label: "Staff Management", icon: Users },
  { path: "/setup", label: "Public Flow Setup", icon: Workflow },
  { path: "/settings", label: "Integrations", icon: Link2 },
  { path: "/inventory", label: "Inventory", icon: Boxes },
];

const staffNavConfig: RoleNavItemConfig[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/inbox", label: "Inbox", icon: Mail },
  { path: "/bookings", label: "Bookings", icon: CalendarCheck },
  { path: "/setup", label: "Public Flow Setup", icon: Workflow },
  { path: "/forms", label: "Forms", icon: Gauge },
  { path: "/inventory", label: "Inventory", icon: Boxes },
];

function subscribeNoop() {
  return () => undefined;
}

export function useAppShell({ role, basePath = "" }: UseAppShellOptions) {
  const session = useSyncExternalStore(
    subscribeSessionState,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!session.token) {
      router.replace("/login");
      return;
    }

    const sessionRole = session.role ?? "owner";
    if (sessionRole !== role) {
      router.replace(`/${sessionRole}/dashboard`);
    }
  }, [isHydrated, role, router, session.role, session.token]);

  useEffect(() => {
    if (!isHydrated || !session.token || role !== "owner") {
      return;
    }

    const normalizedBasePath =
      !basePath || basePath === "/" ? "" : basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    const dashboardPath = `${normalizedBasePath}/dashboard` || "/dashboard";
    const isDashboardRoute =
      pathname === dashboardPath || pathname.startsWith(`${dashboardPath}/`);

    if (!isDashboardRoute) {
      return;
    }

    let active = true;
    const enforceOnboardingGate = async () => {
      try {
        const me = await getMe();
        const workspace =
          (session.workspaceId
            ? me.workspaces.find((item) => item.id === session.workspaceId)
            : undefined) ?? me.workspaces[0];
        if (!active) {
          return;
        }
        if (workspace?.onboardingStatus !== "active") {
          router.replace("/onboarding");
        }
      } catch {
        if (!active) {
          return;
        }
        router.replace("/login");
      }
    };

    void enforceOnboardingGate();

    return () => {
      active = false;
    };
  }, [basePath, isHydrated, pathname, role, router, session.token, session.workspaceId]);

  const navItems = useMemo<AppNavItem[]>(() => {
    const navConfig = role === "owner" ? ownerNavConfig : staffNavConfig;
    return navConfig.map((item) => ({
      href: `${basePath}${item.path}`,
      label: item.label,
      icon: item.icon,
    }));
  }, [basePath, role]);

  return {
    title: role === "owner" ? "CareOps Owner Console" : "CareOps Staff Workspace",
    workspaceLabel: session.workspaceId ?? "workspace-not-set",
    navItems,
    onSignOut: clearSessionState,
  };
}

