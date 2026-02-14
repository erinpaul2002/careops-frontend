"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { registerOwner } from "@/lib/api/client";
import { setSessionState } from "@/lib/session";
import type { AuthSignupState } from "@/components/AuthSignup/types";

export function useAuthSignup() {
  const [state, setState] = useState<AuthSignupState>(() => ({
    name: "",
    email: "",
    password: "",
    workspaceName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    loading: false,
    error: null,
  }));
  const router = useRouter();

  const onChange = useCallback((field: keyof AuthSignupState, value: string) => {
    setState((previous) => ({ ...previous, [field]: value }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!state.name || !state.email || !state.password || !state.workspaceName) {
      setState((previous) => ({ ...previous, error: "Fill all required fields." }));
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const payload = await registerOwner({
        name: state.name,
        email: state.email,
        password: state.password,
        workspaceName: state.workspaceName,
        timezone: state.timezone,
      });

      setSessionState({
        token: payload.token,
        userName: payload.user.name,
        workspaceId: payload.workspace?.id,
        role: "owner",
      });

      router.push("/onboarding");
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: "Signup failed. Verify backend is running and try again.",
      }));
      return;
    }

    setState((previous) => ({ ...previous, loading: false }));
  }, [router, state.email, state.name, state.password, state.timezone, state.workspaceName]);

  return {
    ...state,
    onChange,
    onSubmit,
  };
}
