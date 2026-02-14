"use client";

import { Suspense } from "react";
import LegacySettingsRedirectPage from "./LegacySettingsRedirectPage";

export default function Page() {
  return (
    <Suspense fallback={
      <main
        className="flex min-h-screen items-center justify-center px-4 text-sm"
        style={{ background: "var(--background-gray)", color: "#5A6A7A" }}
      >
        Redirecting...
      </main>
    }>
      <LegacySettingsRedirectPage />
    </Suspense>
  );
}
