export interface AuthSignupState {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
  timezone: string;
  loading: boolean;
  error: string | null;
}

export interface AuthSignupUIProps extends AuthSignupState {
  onChange: (field: keyof AuthSignupState, value: string) => void;
  onSubmit: () => Promise<void>;
}
