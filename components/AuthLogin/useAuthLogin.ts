"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, login, staffLogin } from "@/lib/api/client";
import { setSessionState } from "@/lib/session";
import type { AuthLoginMode, AuthLoginState } from "@/components/AuthLogin/types";

const initialState: AuthLoginState = {
  mode: "owner",
  email: "",
  password: "",
  loading: false,
  error: null,
};

export function useAuthLogin() {
  const [state, setState] = useState<AuthLoginState>(initialState);
  const router = useRouter();

  const onModeChange = useCallback((mode: AuthLoginMode) => {
    setState((previous) => ({ ...previous, mode, error: null }));
  }, []);

  const onEmailChange = useCallback((email: string) => {
    setState((previous) => ({ ...previous, email }));
  }, []);

  const onPasswordChange = useCallback((password: string) => {
    setState((previous) => ({ ...previous, password }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (state.mode === "owner" && !state.email) {
      setState((previous) => ({ ...previous, error: "Email is required for owner login." }));
      return;
    }
    if (state.mode === "staff" && !state.email.trim()) {
      setState((previous) => ({ ...previous, error: "Email is required for staff login." }));
      return;
    }
    if (!state.password) {
      setState((previous) => ({ ...previous, error: "Password is required." }));
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const auth =
        state.mode === "owner"
          ? await login({ email: state.email, password: state.password })
          : await staffLogin({ email: state.email.trim(), password: state.password });

      setSessionState({ token: auth.token, userName: auth.user.name });

      const me = await getMe();
      const workspace = me.workspaces[0];
      const role = workspace?.role ?? (state.mode === "staff" ? "staff" : "owner");

      setSessionState({
        token: auth.token,
        userName: auth.user.name,
        workspaceId: workspace?.id,
        role,
      });

      const targetPath =
        role === "owner"
          ? workspace?.id && workspace.onboardingStatus !== "active"
            ? "/onboarding"
            : "/owner/dashboard"
          : `/${role}/dashboard`;

      router.push(targetPath);
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        error:
          state.mode === "staff"
            ? "Staff login failed. Verify email and password."
            : "Login failed. Verify credentials and backend availability.",
      }));
      return;
    }

    setState((previous) => ({ ...previous, loading: false }));
  }, [router, state.email, state.mode, state.password]);

  return {
    ...state,
    onModeChange,
    onEmailChange,
    onPasswordChange,
    onSubmit,
  };
}
