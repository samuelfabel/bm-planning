import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { PlanningConfig, ConnectionStatus } from '@/types/planning';
import { DECK_PRESETS } from '@/mocks/config';

const STORAGE_KEY = 'bm-planning-auth';

interface AuthContextValue {
  config: PlanningConfig | null;
  connectionStatus: ConnectionStatus;
  saveConfig: (partial: Partial<PlanningConfig>) => void;
  clearConfig: () => void;
  testConnection: () => Promise<boolean>;
}

const defaultConfig: PlanningConfig = {
  subdomain: '',
  apiKey: '',
  customFieldMapping: null,
  deck: {
    type: 'fibonacci',
    values: DECK_PRESETS.fibonacci,
    allowPass: true,
    allowBreak: false,
  },
  facilitatorDisplayName: '',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PlanningConfig | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (config?.subdomain && config?.apiKey) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [config]);

  const saveConfig = useCallback((partial: Partial<PlanningConfig>) => {
    setConfig((prev) => {
      const next = { ...(prev ?? defaultConfig), ...partial };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearConfig = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setConfig(null);
    setConnectionStatus('disconnected');
  }, []);

  const testConnection = useCallback(async () => {
    setConnectionStatus('connecting');
    await new Promise((r) => setTimeout(r, 800));
    const ok = Boolean(config?.subdomain && config?.apiKey);
    setConnectionStatus(ok ? 'connected' : 'error');
    return ok;
  }, [config]);

  return (
    <AuthContext.Provider value={{ config, connectionStatus, saveConfig, clearConfig, testConnection }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
