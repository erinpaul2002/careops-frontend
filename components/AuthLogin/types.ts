export type AuthLoginMode = "owner" | "staff";

export interface AuthLoginState {
  mode: AuthLoginMode;
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
}

export interface AuthLoginUIProps extends AuthLoginState {
  onModeChange: (mode: AuthLoginMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}
