import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { WorkspaceConfig, UserProfile, ConnectionStatus } from '@/types/planning';
import { testBusinessmapConnection } from '@/services/businessmapApi';
import { applyNightMode } from '@/utils/theme';

const STORAGE_KEY = 'bm-planning-auth';

interface AuthStorage {
  workspace: WorkspaceConfig;
  profile: UserProfile;
}

interface AuthContextValue {
  workspace: WorkspaceConfig;
  profile: UserProfile;
  connectionStatus: ConnectionStatus;
  saveWorkspace: (partial: Partial<WorkspaceConfig>) => void;
  saveProfile: (partial: Partial<UserProfile>) => void;
  clearAuth: () => void;
  testConnection: () => Promise<boolean>;
}

const defaultWorkspace: WorkspaceConfig = {
  subdomain: '',
  customFieldMapping: null,
  estimationTarget: { kind: 'custom_field', customFieldMapping: null },
  companyLogoUrl: null,
  allowDescriptionEdit: false,
  showSubtasks: false,
  allowSubtasks: false,
};

const defaultProfile: UserProfile = {
  apiKey: '',
  displayName: '',
  facilitatorRole: 'croupier',
  nightMode: false,
};

function migrateStored(raw: Record<string, unknown>): AuthStorage {
  if (raw.workspace && raw.profile) {
    return {
      workspace: { ...defaultWorkspace, ...(raw.workspace as WorkspaceConfig) },
      profile: { ...defaultProfile, ...(raw.profile as UserProfile) },
    };
  }

  return {
    workspace: {
      ...defaultWorkspace,
      subdomain: (raw.subdomain as string) ?? '',
      customFieldMapping: (raw.customFieldMapping as WorkspaceConfig['customFieldMapping']) ?? null,
      estimationTarget:
        (raw.estimationTarget as WorkspaceConfig['estimationTarget']) ??
        defaultWorkspace.estimationTarget,
      companyLogoUrl: (raw.companyLogoUrl as string | null) ?? null,
      allowDescriptionEdit: Boolean(raw.allowDescriptionEdit),
      showSubtasks: Boolean(raw.showSubtasks),
      allowSubtasks: Boolean(raw.allowSubtasks),
    },
    profile: {
      ...defaultProfile,
      apiKey: (raw.apiKey as string) ?? '',
      displayName: (raw.facilitatorDisplayName as string) ?? (raw.displayName as string) ?? '',
      facilitatorRole: (raw.facilitatorRole as UserProfile['facilitatorRole']) ?? 'croupier',
      nightMode: Boolean((raw.profile as UserProfile | undefined)?.nightMode ?? raw.nightMode),
    },
  };
}

function loadStorage(): AuthStorage {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return { workspace: defaultWorkspace, profile: defaultProfile };
    return migrateStored(JSON.parse(stored) as Record<string, unknown>);
  } catch {
    return { workspace: defaultWorkspace, profile: defaultProfile };
  }
}

function persistStorage(workspace: WorkspaceConfig, profile: UserProfile) {
  const payload: AuthStorage = { workspace, profile };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadStorage);
  const [workspace, setWorkspace] = useState<WorkspaceConfig>(initial.workspace);
  const [profile, setProfile] = useState<UserProfile>(initial.profile);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    applyNightMode(profile.nightMode);
  }, [profile.nightMode]);

  useEffect(() => {
    if (workspace.subdomain && profile.apiKey) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [workspace.subdomain, profile.apiKey]);

  useEffect(() => {
    persistStorage(workspace, profile);
  }, [workspace, profile]);

  const saveWorkspace = useCallback((partial: Partial<WorkspaceConfig>) => {
    setWorkspace((prev) => ({ ...prev, ...partial }));
  }, []);

  const saveProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setWorkspace(defaultWorkspace);
    setProfile(defaultProfile);
    setConnectionStatus('disconnected');
  }, []);

  const testConnection = useCallback(async () => {
    if (!workspace.subdomain || !profile.apiKey) {
      setConnectionStatus('error');
      return false;
    }

    setConnectionStatus('connecting');
    try {
      await testBusinessmapConnection({
        subdomain: workspace.subdomain,
        apiKey: profile.apiKey,
      });

      setConnectionStatus('connected');
      return true;
    } catch {
      setConnectionStatus('error');
      return false;
    }
  }, [workspace, profile]);

  return (
    <AuthContext.Provider
      value={{
        workspace,
        profile,
        connectionStatus,
        saveWorkspace,
        saveProfile,
        clearAuth,
        testConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useApiCredentials() {
  const { workspace, profile } = useAuth();
  return useMemo(() => {
    if (!workspace.subdomain || !profile.apiKey) return null;
    return { subdomain: workspace.subdomain, apiKey: profile.apiKey };
  }, [workspace.subdomain, profile.apiKey]);
}
