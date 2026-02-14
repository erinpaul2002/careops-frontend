export interface SessionState {
  token?: string;
  workspaceId?: string;
  userName?: string;
  role?: "owner" | "staff";
}

const SESSION_KEYS = {
  token: "careops.token",
  workspaceId: "careops.workspaceId",
  userName: "careops.userName",
  role: "careops.role",
} as const;

const emptySessionState: SessionState = {};
let cachedSessionState: SessionState = emptySessionState;
let cacheInitialized = false;
let storageListenerAttached = false;
const sessionListeners = new Set<() => void>();

function read(key: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value = window.localStorage.getItem(key);
  return value === null ? undefined : value;
}

function write(key: string, value: string | undefined): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

function readSessionStateFromStorage(): SessionState {
  return {
    token: read(SESSION_KEYS.token),
    workspaceId: read(SESSION_KEYS.workspaceId),
    userName: read(SESSION_KEYS.userName),
    role: (read(SESSION_KEYS.role) as "owner" | "staff" | undefined) ?? undefined,
  };
}

function hasSessionStateChanged(next: SessionState): boolean {
  return (
    cachedSessionState.token !== next.token ||
    cachedSessionState.workspaceId !== next.workspaceId ||
    cachedSessionState.userName !== next.userName ||
    cachedSessionState.role !== next.role
  );
}

function publishSessionState(next: SessionState): void {
  if (!hasSessionStateChanged(next)) {
    return;
  }
  cachedSessionState = next;
  sessionListeners.forEach((listener) => listener());
}

function ensureSessionStateCache(): SessionState {
  if (typeof window === "undefined") {
    return emptySessionState;
  }
  if (!cacheInitialized) {
    cachedSessionState = readSessionStateFromStorage();
    cacheInitialized = true;
  }
  return cachedSessionState;
}

function attachStorageListener(): void {
  if (typeof window === "undefined" || storageListenerAttached) {
    return;
  }

  const trackedKeys = new Set<string>(Object.values(SESSION_KEYS));
  window.addEventListener("storage", (event) => {
    if (event.key !== null && !trackedKeys.has(event.key)) {
      return;
    }
    publishSessionState(readSessionStateFromStorage());
  });
  storageListenerAttached = true;
}

export function subscribeSessionState(listener: () => void): () => void {
  sessionListeners.add(listener);
  attachStorageListener();
  return () => {
    sessionListeners.delete(listener);
  };
}

export function getSessionSnapshot(): SessionState {
  return ensureSessionStateCache();
}

export function getServerSessionSnapshot(): SessionState {
  return emptySessionState;
}

export function getSessionState(): SessionState {
  return ensureSessionStateCache();
}

export function setSessionState(next: SessionState): void {
  write(SESSION_KEYS.token, next.token);
  write(SESSION_KEYS.workspaceId, next.workspaceId);
  write(SESSION_KEYS.userName, next.userName);
  write(SESSION_KEYS.role, next.role);

  publishSessionState({
    token: next.token,
    workspaceId: next.workspaceId,
    userName: next.userName,
    role: next.role,
  });
}

export function clearSessionState(): void {
  setSessionState({});
}
