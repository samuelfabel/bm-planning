import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type LiveConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface ConnectionContextValue {
  status: LiveConnectionStatus;
  error: string | null;
  setStatus: (status: LiveConnectionStatus) => void;
  setError: (error: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LiveConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const value = useMemo(
    () => ({ status, error, setStatus, setError }),
    [status, error],
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
}
