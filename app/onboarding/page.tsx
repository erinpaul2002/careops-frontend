"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import { getMe } from "@/lib/api/client";
import { getSessionState } from "@/lib/session";

export default function StandaloneOnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const session = getSessionState();
      if (!session.token) {
        router.replace("/login");
        return;
      }
      if (session.role === "staff") {
        router.replace("/staff/dashboard");
        return;
      }

      try {
        const me = await getMe();
        const workspace =
          (session.workspaceId
            ? me.workspaces.find((item) => item.id === session.workspaceId)
            : undefined) ?? me.workspaces[0];

        if (!workspace) {
          router.replace("/signup");
          return;
        }

        if (workspace.onboardingStatus === "active") {
          router.replace("/owner/dashboard");
          return;
        }

        if (!active) {
          return;
        }
        setReady(true);
      } catch {
        router.replace("/login");
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-sm"
        style={{ background: "var(--background-gray)", color: "#5A6A7A" }}
      >
        Loading onboarding...
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6" style={{ background: "var(--background-gray)" }}>
      <Onboarding basePath="/owner" />
    </main>
  );
}
