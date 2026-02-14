"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "@/lib/api/client";
import { getSessionState } from "@/lib/session";

export default function LegacySettingsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    const redirect = async () => {
      const session = getSessionState();
      const query = searchParams.toString();
      const querySuffix = query ? `?${query}` : "";

      if (!session.token) {
        router.replace(`/login${querySuffix}`);
        return;
      }
      if (session.role === "staff") {
        router.replace(`/staff/dashboard${querySuffix}`);
        return;
      }

      try {
        const me = await getMe();
        const workspace =
          (session.workspaceId
            ? me.workspaces.find((item) => item.id === session.workspaceId)
            : undefined) ?? me.workspaces[0];

        if (!active) {
          return;
        }

        if (workspace?.onboardingStatus === "active") {
          router.replace(`/owner/settings${querySuffix}`);
          return;
        }
        router.replace(`/onboarding${querySuffix}`);
      } catch {
        if (!active) {
          return;
        }
        router.replace(`/login${querySuffix}`);
      }
    };

    void redirect();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 text-sm"
      style={{ background: "var(--background-gray)", color: "#5A6A7A" }}
    >
      Redirecting...
    </main>
  );
}