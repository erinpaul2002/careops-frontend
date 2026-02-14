"use client";

import AuthLoginUI from "@/components/AuthLogin/AuthLoginUI";
import { useAuthLogin } from "@/components/AuthLogin/useAuthLogin";

export default function AuthLogin() {
  const {
    mode,
    email,
    password,
    loading,
    error,
    onModeChange,
    onEmailChange,
    onPasswordChange,
    onSubmit,
  } = useAuthLogin();

  return (
    <AuthLoginUI
      mode={mode}
      email={email}
      password={password}
      loading={loading}
      error={error}
      onModeChange={onModeChange}
      onEmailChange={onEmailChange}
      onPasswordChange={onPasswordChange}
      onSubmit={onSubmit}
    />
  );
}
