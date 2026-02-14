"use client";

import AuthSignupUI from "@/components/AuthSignup/AuthSignupUI";
import { useAuthSignup } from "@/components/AuthSignup/useAuthSignup";

export default function AuthSignup() {
  const {
    name,
    email,
    password,
    workspaceName,
    timezone,
    loading,
    error,
    onChange,
    onSubmit,
  } = useAuthSignup();

  return (
    <AuthSignupUI
      name={name}
      email={email}
      password={password}
      workspaceName={workspaceName}
      timezone={timezone}
      loading={loading}
      error={error}
      onChange={onChange}
      onSubmit={onSubmit}
    />
  );
}
